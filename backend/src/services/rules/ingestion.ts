/**
 * Ingestion Service for Rules Explorer
 * Handles PDF/TXT document parsing, chapter/section detection, and database population
 *
 * Tasks: T009-T017
 */

import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../models/database.types.js';
import {
  DocumentStatus,
  FileType,
  ExtractedText,
  DetectedChapter,
  DetectedSection,
  DetectedEntry,
  IngestionStatus,
  IngestionProgress,
} from '../../models/rules.types.js';

// Dynamic import for pdf-parse to handle ESM/CJS differences
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfParseLib: any;
async function getPdfParser(): Promise<(buffer: Buffer) => Promise<{ text: string; numpages: number; info: unknown; version: string }>> {
  if (!pdfParseLib) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pdfParseLib = require('pdf-parse');
  }
  return pdfParseLib;
}
import { generateEmbeddings, formatEmbeddingForPgvector } from './embeddings.js';

// Chapter detection patterns
const CHAPTER_PATTERNS = [
  /^CHAPTER\s+(\d+|[IVXLCDM]+)[:\s]*(.+)?$/im,
  /^PART\s+(\d+|[IVXLCDM]+)[:\s]*(.+)?$/im,
  /^([A-Z][A-Z\s]{10,})$/m, // All caps lines > 10 chars
];

// Section detection patterns
const SECTION_PATTERNS = [
  /^##\s+(.+)$/m,
  /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*):$/m, // Title Case followed by colon
  /^\*\*(.+)\*\*$/m, // Bold text
];

// Track ingestion progress in memory (could be moved to Redis for production)
const ingestionProgress = new Map<string, IngestionProgress>();

// Type alias for Supabase client with looser typing for operations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any>;

/**
 * RulesIngestionService handles document ingestion pipeline
 */
export class RulesIngestionService {
  private client: DbClient;

  constructor(client: SupabaseClient<Database>) {
    this.client = client as DbClient;
  }

  /**
   * Calculate SHA-256 hash of file content for duplicate detection
   */
  calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Extract text from PDF file
   */
  async extractTextFromPDF(buffer: Buffer): Promise<ExtractedText> {
    try {
      const parser = await getPdfParser();
      const data = await parser(buffer);
      return {
        text: data.text,
        pages: data.numpages,
        metadata: {
          info: data.info,
          version: data.version,
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from TXT file
   */
  async extractTextFromTXT(buffer: Buffer): Promise<ExtractedText> {
    return {
      text: buffer.toString('utf-8'),
      pages: undefined,
      metadata: {},
    };
  }

  /**
   * Detect chapters in document text
   */
  detectChapters(text: string): DetectedChapter[] {
    const chapters: DetectedChapter[] = [];
    const lines = text.split('\n');
    let currentChapter: DetectedChapter | null = null;
    let contentBuffer: string[] = [];
    let orderIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      let isChapterStart = false;
      let chapterTitle = '';

      // Check against chapter patterns
      for (const pattern of CHAPTER_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          // For all-caps pattern, require line to be meaningful
          if (pattern.source.includes('[A-Z][A-Z')) {
            // Skip if line is too short or common header
            if (line.length < 12 || /^(TABLE OF CONTENTS|INDEX|APPENDIX)$/i.test(line)) {
              continue;
            }
          }
          isChapterStart = true;
          chapterTitle = match[2] ? `${match[1]}: ${match[2]}`.trim() : line;
          break;
        }
      }

      if (isChapterStart) {
        // Save previous chapter
        if (currentChapter) {
          currentChapter.content = contentBuffer.join('\n').trim();
          chapters.push(currentChapter);
        }

        // Start new chapter
        currentChapter = {
          title: chapterTitle,
          content: '',
          orderIndex: orderIndex++,
        };
        contentBuffer = [];
      } else if (currentChapter) {
        contentBuffer.push(line);
      } else {
        // Content before first chapter - create an "Introduction" chapter
        if (line.length > 0) {
          if (!currentChapter) {
            currentChapter = {
              title: 'Introduction',
              content: '',
              orderIndex: orderIndex++,
            };
          }
          contentBuffer.push(line);
        }
      }
    }

    // Don't forget the last chapter
    if (currentChapter) {
      currentChapter.content = contentBuffer.join('\n').trim();
      chapters.push(currentChapter);
    }

    // If no chapters detected, treat entire document as one chapter
    if (chapters.length === 0 && text.trim().length > 0) {
      chapters.push({
        title: 'Content',
        content: text.trim(),
        orderIndex: 0,
      });
    }

    return chapters;
  }

  /**
   * Detect sections within a chapter
   */
  detectSections(chapterContent: string): DetectedSection[] {
    const sections: DetectedSection[] = [];
    const lines = chapterContent.split('\n');
    let currentSection: DetectedSection | null = null;
    let contentBuffer: string[] = [];
    let orderIndex = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      let isSectionStart = false;
      let sectionTitle = '';

      // Check against section patterns
      for (const pattern of SECTION_PATTERNS) {
        const match = trimmedLine.match(pattern);
        if (match) {
          isSectionStart = true;
          sectionTitle = match[1] || trimmedLine;
          break;
        }
      }

      if (isSectionStart && sectionTitle.length > 2) {
        // Save previous section
        if (currentSection) {
          currentSection.content = contentBuffer.join('\n').trim();
          if (currentSection.content.length > 0) {
            sections.push(currentSection);
          }
        }

        // Start new section
        currentSection = {
          title: sectionTitle.replace(/[*#:]/g, '').trim(),
          content: '',
          orderIndex: orderIndex++,
        };
        contentBuffer = [];
      } else {
        contentBuffer.push(line);
      }
    }

    // Don't forget the last section
    if (currentSection) {
      currentSection.content = contentBuffer.join('\n').trim();
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }
    }

    // If no sections detected, treat entire chapter as one section
    if (sections.length === 0 && chapterContent.trim().length > 0) {
      sections.push({
        title: 'Main Content',
        content: chapterContent.trim(),
        orderIndex: 0,
      });
    }

    return sections;
  }

  /**
   * Extract individual rule entries from section content
   */
  extractEntries(sectionContent: string): DetectedEntry[] {
    const entries: DetectedEntry[] = [];

    // Split content into paragraphs (entries)
    const paragraphs = sectionContent.split(/\n\n+/).filter(p => p.trim().length > 0);

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();

      // Skip very short paragraphs
      if (paragraph.length < 20) continue;

      // Try to extract title from first line if it looks like a heading
      const lines = paragraph.split('\n');
      let title: string | undefined;
      let content = paragraph;

      if (lines.length > 1) {
        const firstLine = lines[0].trim();
        // Check if first line looks like a title (short, possibly bold/caps)
        if (
          firstLine.length < 80 &&
          (firstLine.match(/^\*\*(.+)\*\*$/) ||
            firstLine.match(/^[A-Z][A-Za-z\s]+$/) ||
            firstLine.endsWith(':'))
        ) {
          title = firstLine.replace(/[\*:]/g, '').trim();
          content = lines.slice(1).join('\n').trim();
        }
      }

      // Detect page references like "(p. 123)" or "(PHB 45)"
      const pageMatch = paragraph.match(/\((?:p\.?\s*|PHB\s*|page\s*)(\d+(?:-\d+)?)\)/i);
      const pageReference = pageMatch ? `p. ${pageMatch[1]}` : undefined;

      entries.push({
        title,
        content,
        pageReference,
        orderIndex: i,
      });
    }

    // If no entries extracted, create one from the whole section
    if (entries.length === 0 && sectionContent.trim().length >= 20) {
      entries.push({
        content: sectionContent.trim(),
        orderIndex: 0,
      });
    }

    return entries;
  }

  /**
   * Check if a document with this hash already exists
   */
  async checkDuplicate(fileHash: string): Promise<string | null> {
    const { data } = await this.client
      .from('source_documents')
      .select('id')
      .eq('file_hash', fileHash)
      .single();

    return data?.id ?? null;
  }

  /**
   * Update ingestion progress
   */
  private updateProgress(
    documentId: string,
    updates: Partial<IngestionProgress>
  ): void {
    const current = ingestionProgress.get(documentId) || {
      chaptersProcessed: 0,
      sectionsProcessed: 0,
      entriesProcessed: 0,
      embeddingsGenerated: 0,
    };

    ingestionProgress.set(documentId, { ...current, ...updates });
  }

  /**
   * Full document ingestion pipeline
   */
  async ingestDocument(
    file: Buffer,
    name: string,
    fileType: FileType,
    userId?: string
  ): Promise<string> {
    // Calculate file hash
    const fileHash = this.calculateFileHash(file);

    // Check for duplicates
    const existingId = await this.checkDuplicate(fileHash);
    if (existingId) {
      throw new Error(`DUPLICATE:${existingId}`);
    }

    // Create document record
    const { data: docData, error: docError } = await this.client
      .from('source_documents')
      .insert({
        name,
        file_type: fileType,
        file_hash: fileHash,
        ingested_by: userId,
        status: 'processing',
      })
      .select()
      .single();

    if (docError || !docData) {
      throw new Error(`Failed to create document record: ${docError?.message}`);
    }

    const documentId = docData.id;

    // Initialize progress tracking
    this.updateProgress(documentId, {
      chaptersProcessed: 0,
      sectionsProcessed: 0,
      entriesProcessed: 0,
      embeddingsGenerated: 0,
    });

    try {
      // Extract text
      const extracted =
        fileType === 'pdf'
          ? await this.extractTextFromPDF(file)
          : await this.extractTextFromTXT(file);

      // Update page count if available
      if (extracted.pages) {
        await this.client
          .from('source_documents')
          .update({ total_pages: extracted.pages })
          .eq('id', documentId);
      }

      // Detect chapters
      const chapters = this.detectChapters(extracted.text);
      const allEntries: { entry: DetectedEntry; sectionId: string }[] = [];

      // Process each chapter
      for (const chapter of chapters) {
        // Insert chapter
        const { data: chapterData, error: chapterError } = await this.client
          .from('rule_chapters')
          .insert({
            document_id: documentId,
            title: chapter.title,
            order_index: chapter.orderIndex,
            page_start: chapter.pageStart,
            page_end: chapter.pageEnd,
          })
          .select()
          .single();

        if (chapterError || !chapterData) {
          throw new Error(`Failed to insert chapter: ${chapterError?.message}`);
        }

        this.updateProgress(documentId, {
          chaptersProcessed: (ingestionProgress.get(documentId)?.chaptersProcessed || 0) + 1,
        });

        // Detect sections in chapter
        const sections = this.detectSections(chapter.content);

        for (const section of sections) {
          // Insert section
          const { data: sectionData, error: sectionError } = await this.client
            .from('rule_sections')
            .insert({
              chapter_id: chapterData.id,
              title: section.title,
              order_index: section.orderIndex,
              page_start: section.pageStart,
              page_end: section.pageEnd,
            })
            .select()
            .single();

          if (sectionError || !sectionData) {
            throw new Error(`Failed to insert section: ${sectionError?.message}`);
          }

          this.updateProgress(documentId, {
            sectionsProcessed: (ingestionProgress.get(documentId)?.sectionsProcessed || 0) + 1,
          });

          // Extract entries
          const entries = this.extractEntries(section.content);

          for (const entry of entries) {
            // Insert entry (without embedding for now)
            const { data: entryData, error: entryError } = await this.client
              .from('rule_entries')
              .insert({
                section_id: sectionData.id,
                title: entry.title,
                content: entry.content,
                page_reference: entry.pageReference,
                order_index: entry.orderIndex,
              })
              .select()
              .single();

            if (entryError || !entryData) {
              throw new Error(`Failed to insert entry: ${entryError?.message}`);
            }

            allEntries.push({ entry, sectionId: sectionData.id });

            this.updateProgress(documentId, {
              entriesProcessed: (ingestionProgress.get(documentId)?.entriesProcessed || 0) + 1,
            });
          }
        }
      }

      // Generate embeddings for all entries in batches
      if (allEntries.length > 0) {
        await this.generateEmbeddingsForEntries(documentId, allEntries);
      }

      // Mark as completed
      await this.client
        .from('source_documents')
        .update({ status: 'completed' })
        .eq('id', documentId);

      return documentId;
    } catch (error) {
      // Mark as failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.client
        .from('source_documents')
        .update({
          status: 'failed',
          error_log: errorMessage,
        })
        .eq('id', documentId);

      throw error;
    }
  }

  /**
   * Generate embeddings for entries and update database
   */
  private async generateEmbeddingsForEntries(
    documentId: string,
    entries: { entry: DetectedEntry; sectionId: string }[]
  ): Promise<void> {
    // Get all entry IDs and contents
    const { data: dbEntries } = await this.client
      .from('rule_entries')
      .select('id, content, title')
      .in(
        'section_id',
        entries.map(e => e.sectionId)
      );

    if (!dbEntries || dbEntries.length === 0) return;

    // Prepare texts for embedding (combine title and content)
    const texts = dbEntries.map(e => {
      const titlePart = e.title ? `${e.title}\n\n` : '';
      return `${titlePart}${e.content}`;
    });

    // Generate embeddings with progress tracking
    const embeddings = await generateEmbeddings(texts, (processed, _total) => {
      this.updateProgress(documentId, {
        embeddingsGenerated: processed,
      });
    });

    // Update entries with embeddings
    for (let i = 0; i < dbEntries.length; i++) {
      const embedding = formatEmbeddingForPgvector(embeddings[i]);

      // Use raw SQL for pgvector update
      await this.client.rpc('update_entry_embedding', {
        entry_id: dbEntries[i].id,
        embedding_vector: embedding,
      });
    }
  }

  /**
   * Get ingestion status for a document
   */
  async getIngestionStatus(documentId: string): Promise<IngestionStatus | null> {
    const { data } = await this.client
      .from('source_documents')
      .select('id, status, error_log')
      .eq('id', documentId)
      .single();

    if (!data) return null;

    const progress = ingestionProgress.get(documentId) || {
      chaptersProcessed: 0,
      sectionsProcessed: 0,
      entriesProcessed: 0,
      embeddingsGenerated: 0,
    };

    return {
      documentId: data.id,
      status: data.status as DocumentStatus,
      progress,
      errorLog: data.error_log,
    };
  }

  /**
   * Delete a document and all related data (cascades automatically)
   */
  async deleteDocument(documentId: string): Promise<void> {
    const { error } = await this.client
      .from('source_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }

    // Clean up progress tracking
    ingestionProgress.delete(documentId);
  }
}

/**
 * Factory function to create ingestion service
 */
export function createIngestionService(
  client: SupabaseClient<Database>
): RulesIngestionService {
  return new RulesIngestionService(client);
}

export default RulesIngestionService;
