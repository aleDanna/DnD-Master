/**
 * Script to ingest rulebook documents from docs/ folder into the database
 * Run with: npx tsx scripts/ingest-rules.ts
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db, query, initializeDatabase } from '../src/config/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Chapter {
  title: string;
  orderIndex: number;
  pageStart?: number;
  sections: Section[];
}

interface Section {
  title: string;
  orderIndex: number;
  entries: Entry[];
}

interface Entry {
  title?: string;
  content: string;
  pageReference?: string;
  orderIndex: number;
}

/**
 * Parse a rules text file into structured chapters, sections, and entries
 */
function parseRulesDocument(content: string): Chapter[] {
  const lines = content.split('\n');
  const chapters: Chapter[] = [];

  let currentChapter: Chapter | null = null;
  let currentSection: Section | null = null;
  let currentEntry: Entry | null = null;
  let contentBuffer: string[] = [];
  let entryIndex = 0;
  let sectionIndex = 0;

  // Patterns to detect structure
  const chapterPattern = /^Ch\.\s*\d+:\s*(.+)$/i;
  const partPattern = /^Part\s*\d+:\s*(.+)$/i;
  const sectionPattern = /^([A-Z][A-Za-z\s\-']+)\.{3,}|^([A-Z][A-Za-z\s\-']{2,})$/;
  const pagePattern = /^(\d+)$/;

  function saveCurrentEntry() {
    if (currentEntry && contentBuffer.length > 0) {
      currentEntry.content = contentBuffer.join('\n').trim();
      if (currentEntry.content.length > 50) { // Only save meaningful entries
        currentSection?.entries.push(currentEntry);
      }
    }
    contentBuffer = [];
    currentEntry = null;
  }

  function saveCurrentSection() {
    saveCurrentEntry();
    if (currentSection && currentSection.entries.length > 0) {
      currentChapter?.sections.push(currentSection);
    }
    currentSection = null;
    entryIndex = 0;
  }

  function saveCurrentChapter() {
    saveCurrentSection();
    if (currentChapter && currentChapter.sections.length > 0) {
      chapters.push(currentChapter);
    }
    currentChapter = null;
    sectionIndex = 0;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines at the start of content
    if (!line && contentBuffer.length === 0) continue;

    // Check for chapter headers
    const chapterMatch = line.match(chapterPattern) || line.match(partPattern);
    if (chapterMatch) {
      saveCurrentChapter();
      currentChapter = {
        title: chapterMatch[1].trim(),
        orderIndex: chapters.length + 1,
        sections: []
      };
      continue;
    }

    // Check for section headers (lines ending with dots or ALL CAPS short titles)
    if (currentChapter && line.length > 3 && line.length < 60) {
      const isLikelySection =
        (line.includes('...') && !line.includes('....')) ||
        (line === line.toUpperCase() && line.length > 5 && line.length < 40 && !/\d/.test(line)) ||
        (line.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/) && line.length < 40);

      if (isLikelySection) {
        saveCurrentSection();
        const sectionTitle = line.replace(/\.+\s*\d*$/, '').trim();
        currentSection = {
          title: sectionTitle,
          orderIndex: sectionIndex++,
          entries: []
        };
        continue;
      }
    }

    // If we have a section, accumulate content
    if (currentSection) {
      // Check if this looks like a new entry/rule title
      const isEntryTitle =
        line.length > 3 &&
        line.length < 80 &&
        line.match(/^[A-Z][a-z]/) &&
        !line.endsWith('.') &&
        !line.includes('...') &&
        contentBuffer.length > 100; // Only split if we have enough content

      if (isEntryTitle && currentEntry && contentBuffer.join('\n').length > 200) {
        saveCurrentEntry();
        currentEntry = {
          title: line,
          content: '',
          orderIndex: entryIndex++
        };
      } else {
        if (!currentEntry) {
          currentEntry = {
            content: '',
            orderIndex: entryIndex++
          };
        }
        contentBuffer.push(line);
      }
    } else if (currentChapter && line.length > 0) {
      // Content before first section - create a default section
      currentSection = {
        title: 'Introduction',
        orderIndex: sectionIndex++,
        entries: []
      };
      currentEntry = {
        content: '',
        orderIndex: entryIndex++
      };
      contentBuffer.push(line);
    }
  }

  // Save any remaining content
  saveCurrentChapter();

  return chapters;
}

/**
 * Alternative simpler parsing - split by double newlines and group
 */
function parseRulesSimple(content: string, documentName: string): Chapter[] {
  const chapters: Chapter[] = [];

  // Split content into major sections by chapter markers
  const chapterRegex = /(?:^|\n)(Ch\.\s*\d+:\s*[^\n]+|Part\s*\d+:\s*[^\n]+)/gi;
  const parts = content.split(chapterRegex);

  let chapterIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // Check if this is a chapter header
    if (part.match(/^(Ch\.|Part)\s*\d+:/i)) {
      const title = part.replace(/^(Ch\.|Part)\s*\d+:\s*/i, '').trim();

      // Get the content that follows (next part)
      const chapterContent = parts[i + 1] || '';
      i++; // Skip the content part in next iteration

      const sections = parseSections(chapterContent);

      if (sections.length > 0) {
        chapters.push({
          title,
          orderIndex: chapterIndex++,
          sections
        });
      }
    }
  }

  // If no chapters found, create one from the entire content
  if (chapters.length === 0) {
    const sections = parseSections(content);
    if (sections.length > 0) {
      chapters.push({
        title: documentName,
        orderIndex: 0,
        sections
      });
    }
  }

  return chapters;
}

function parseSections(content: string): Section[] {
  const sections: Section[] = [];

  // Split by paragraphs (double newline)
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50);

  let currentSection: Section | null = null;
  let sectionIndex = 0;
  let entryIndex = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    const firstLine = trimmed.split('\n')[0];

    // Check if this paragraph starts a new section
    // (Short first line that looks like a title)
    const isNewSection =
      firstLine.length < 50 &&
      firstLine.length > 3 &&
      !firstLine.endsWith('.') &&
      firstLine.match(/^[A-Z]/);

    if (isNewSection && trimmed.length > 100) {
      // Save previous section
      if (currentSection && currentSection.entries.length > 0) {
        sections.push(currentSection);
      }

      currentSection = {
        title: firstLine.replace(/\.+$/, '').trim(),
        orderIndex: sectionIndex++,
        entries: []
      };
      entryIndex = 0;

      // Add the rest as an entry
      const restContent = trimmed.substring(firstLine.length).trim();
      if (restContent.length > 50) {
        currentSection.entries.push({
          content: restContent,
          orderIndex: entryIndex++
        });
      }
    } else if (currentSection) {
      // Add to current section
      currentSection.entries.push({
        content: trimmed,
        orderIndex: entryIndex++
      });
    } else {
      // No section yet, create default
      currentSection = {
        title: 'General',
        orderIndex: sectionIndex++,
        entries: [{
          content: trimmed,
          orderIndex: entryIndex++
        }]
      };
    }
  }

  // Save last section
  if (currentSection && currentSection.entries.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Ingest a document file into the database
 */
async function ingestDocument(filePath: string): Promise<void> {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileHash = crypto.createHash('sha256').update(content).digest('hex');

  console.log(`\n📄 Processing: ${fileName}`);
  console.log(`   File size: ${(content.length / 1024).toFixed(1)} KB`);

  // Check if document already exists
  const existing = await db.findOne<any>('source_documents', { file_hash: fileHash });
  if (existing) {
    console.log(`   ⚠️  Document already ingested (hash match), skipping...`);
    return;
  }

  // Parse the document
  const chapters = parseRulesSimple(content, fileName.replace(/\.[^.]+$/, ''));

  console.log(`   Found ${chapters.length} chapters`);

  if (chapters.length === 0) {
    console.log(`   ⚠️  No chapters found, skipping...`);
    return;
  }

  // Insert document record
  const doc = await db.insert<any>('source_documents', {
    name: fileName.replace(/\.[^.]+$/, ''),
    file_type: filePath.endsWith('.pdf') ? 'pdf' : 'txt',
    file_hash: fileHash,
    total_pages: null,
    status: 'completed'
  });

  if (!doc) {
    throw new Error('Failed to insert document');
  }

  console.log(`   Document ID: ${doc.id}`);

  let totalSections = 0;
  let totalEntries = 0;

  // Insert chapters, sections, and entries
  for (const chapter of chapters) {
    const chapterRecord = await db.insert<any>('rule_chapters', {
      document_id: doc.id,
      title: chapter.title,
      order_index: chapter.orderIndex,
      page_start: chapter.pageStart || null,
      page_end: null
    });

    if (!chapterRecord) continue;

    for (const section of chapter.sections) {
      totalSections++;

      const sectionRecord = await db.insert<any>('rule_sections', {
        chapter_id: chapterRecord.id,
        title: section.title,
        order_index: section.orderIndex,
        page_start: null,
        page_end: null
      });

      if (!sectionRecord) continue;

      for (const entry of section.entries) {
        totalEntries++;

        await db.insert('rule_entries', {
          section_id: sectionRecord.id,
          title: entry.title || null,
          content: entry.content,
          page_reference: entry.pageReference || null,
          order_index: entry.orderIndex
        });
      }
    }
  }

  console.log(`   ✅ Ingested: ${chapters.length} chapters, ${totalSections} sections, ${totalEntries} entries`);
}

/**
 * Main ingestion function
 */
async function main() {
  console.log('🚀 Starting rules ingestion...\n');

  // Initialize database connection
  initializeDatabase();

  // Find all documents in docs folder
  const docsPath = path.join(process.cwd(), '..', 'docs');

  if (!fs.existsSync(docsPath)) {
    console.error(`❌ Docs folder not found: ${docsPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(docsPath)
    .filter(f => f.endsWith('.txt') || f.endsWith('.pdf'))
    .map(f => path.join(docsPath, f));

  console.log(`Found ${files.length} document(s) to process:`);
  files.forEach(f => console.log(`  - ${path.basename(f)}`));

  // Process each file
  for (const file of files) {
    try {
      // Skip PDFs that are too small (likely empty placeholders)
      const stats = fs.statSync(file);
      if (file.endsWith('.pdf') && stats.size < 100) {
        console.log(`\n⚠️  Skipping ${path.basename(file)} (empty placeholder)`);
        continue;
      }

      await ingestDocument(file);
    } catch (error) {
      console.error(`\n❌ Error processing ${path.basename(file)}:`, error);
    }
  }

  // Show summary
  const docCount = await query('SELECT COUNT(*) as count FROM source_documents');
  const chapterCount = await query('SELECT COUNT(*) as count FROM rule_chapters');
  const sectionCount = await query('SELECT COUNT(*) as count FROM rule_sections');
  const entryCount = await query('SELECT COUNT(*) as count FROM rule_entries');

  console.log('\n====================================================');
  console.log('📊 Ingestion Complete!');
  console.log('====================================================');
  console.log(`Documents:    ${docCount.rows[0].count}`);
  console.log(`Chapters:     ${chapterCount.rows[0].count}`);
  console.log(`Sections:     ${sectionCount.rows[0].count}`);
  console.log(`Rule Entries: ${entryCount.rows[0].count}`);
  console.log('====================================================\n');

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
