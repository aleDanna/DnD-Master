'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRulesDocuments } from '@/hooks/useRulesDocuments';
import { SourceDocument, RuleChapter, RuleSection, RuleEntry } from '@/lib/api';

/**
 * RulesBrowser - Hierarchical sidebar for browsing rules
 * Task: T045
 */

interface RulesBrowserProps {
  token: string | null;
  onEntrySelect?: (entry: RuleEntry) => void;
  className?: string;
}

// Icons as simple SVG components
const ChevronRight = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={cn('h-4 w-4', className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronDown = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={cn('h-4 w-4', className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={cn('h-4 w-4', className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const FolderIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={cn('h-4 w-4', className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    />
  </svg>
);

const FileIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={cn('h-4 w-4', className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

// Tree node component
interface TreeNodeProps {
  label: string;
  icon?: React.ReactNode;
  expanded?: boolean;
  selected?: boolean;
  hasChildren?: boolean;
  count?: number;
  depth?: number;
  onClick?: () => void;
  onToggle?: () => void;
  children?: React.ReactNode;
}

function TreeNode({
  label,
  icon,
  expanded,
  selected,
  hasChildren,
  count,
  depth = 0,
  onClick,
  onToggle,
  children,
}: TreeNodeProps) {
  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer transition-colors',
          'hover:bg-background',
          selected && 'bg-primary/10 text-primary'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
        role="treeitem"
        tabIndex={0}
        aria-expanded={hasChildren ? expanded : undefined}
        aria-selected={selected}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className="p-0.5 hover:bg-muted/20 rounded"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown /> : <ChevronRight />}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Icon */}
        {icon && <span className="flex-shrink-0 text-muted">{icon}</span>}

        {/* Label */}
        <span className="flex-1 truncate text-sm">{label}</span>

        {/* Count badge */}
        {count !== undefined && (
          <span className="text-xs text-muted bg-background px-1.5 py-0.5 rounded">
            {count}
          </span>
        )}
      </div>

      {/* Children */}
      {expanded && children && (
        <div role="group">
          {children}
        </div>
      )}
    </div>
  );
}

// Main component
export function RulesBrowser({ token, onEntrySelect, className }: RulesBrowserProps) {
  const {
    documents,
    chapters,
    sections,
    entries,
    loading,
    error,
    fetchDocuments,
    fetchChapters,
    fetchSections,
    fetchEntries,
  } = useRulesDocuments(token);

  // Track expanded state
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Track loaded items
  const [loadedChapters, setLoadedChapters] = useState<Map<string, RuleChapter[]>>(new Map());
  const [loadedSections, setLoadedSections] = useState<Map<string, RuleSection[]>>(new Map());
  const [loadedEntries, setLoadedEntries] = useState<Map<string, RuleEntry[]>>(new Map());

  // Selected entry
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Load documents on mount
  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [token, fetchDocuments]);

  // Update loaded chapters when chapters change
  useEffect(() => {
    if (chapters.length > 0) {
      const docId = chapters[0].documentId;
      setLoadedChapters((prev) => new Map(prev).set(docId, chapters));
    }
  }, [chapters]);

  // Update loaded sections when sections change
  useEffect(() => {
    if (sections.length > 0) {
      const chapterId = sections[0].chapterId;
      setLoadedSections((prev) => new Map(prev).set(chapterId, sections));
    }
  }, [sections]);

  // Update loaded entries when entries change
  useEffect(() => {
    if (entries.length > 0) {
      const sectionId = entries[0].sectionId;
      setLoadedEntries((prev) => new Map(prev).set(sectionId, entries));
    }
  }, [entries]);

  const toggleDocument = async (doc: SourceDocument) => {
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(doc.id)) {
      newExpanded.delete(doc.id);
    } else {
      newExpanded.add(doc.id);
      // Load chapters if not already loaded
      if (!loadedChapters.has(doc.id)) {
        await fetchChapters(doc.id);
      }
    }
    setExpandedDocuments(newExpanded);
  };

  const toggleChapter = async (chapter: RuleChapter) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapter.id)) {
      newExpanded.delete(chapter.id);
    } else {
      newExpanded.add(chapter.id);
      // Load sections if not already loaded
      if (!loadedSections.has(chapter.id)) {
        await fetchSections(chapter.id);
      }
    }
    setExpandedChapters(newExpanded);
  };

  const toggleSection = async (section: RuleSection) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section.id)) {
      newExpanded.delete(section.id);
    } else {
      newExpanded.add(section.id);
      // Load entries if not already loaded
      if (!loadedEntries.has(section.id)) {
        await fetchEntries(section.id);
      }
    }
    setExpandedSections(newExpanded);
  };

  const handleEntryClick = (entry: RuleEntry) => {
    setSelectedEntryId(entry.id);
    onEntrySelect?.(entry);
  };

  if (!token) {
    return (
      <div className={cn('p-4 text-center text-muted', className)}>
        Please sign in to browse rules
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4', className)}>
        <p className="text-danger text-sm mb-2">{error}</p>
        <button
          onClick={() => fetchDocuments()}
          className="text-primary text-sm hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cn('overflow-auto', className)} role="tree" aria-label="Rules browser">
      {/* Loading state */}
      {loading && documents.length === 0 && (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-2">
              <div className="h-4 w-4 bg-muted/20 rounded" />
              <div className="h-4 bg-muted/20 rounded flex-1" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && documents.length === 0 && (
        <div className="p-4 text-center text-muted text-sm">
          No documents available
        </div>
      )}

      {/* Document tree */}
      {documents.map((doc) => (
        <TreeNode
          key={doc.id}
          label={doc.name}
          icon={<DocumentIcon />}
          expanded={expandedDocuments.has(doc.id)}
          hasChildren={(doc.chapterCount ?? 0) > 0}
          count={doc.chapterCount}
          depth={0}
          onClick={() => toggleDocument(doc)}
          onToggle={() => toggleDocument(doc)}
        >
          {/* Chapters */}
          {loadedChapters.get(doc.id)?.map((chapter) => (
            <TreeNode
              key={chapter.id}
              label={chapter.title}
              icon={<FolderIcon />}
              expanded={expandedChapters.has(chapter.id)}
              hasChildren={(chapter.sectionCount ?? 0) > 0}
              count={chapter.sectionCount}
              depth={1}
              onClick={() => toggleChapter(chapter)}
              onToggle={() => toggleChapter(chapter)}
            >
              {/* Sections */}
              {loadedSections.get(chapter.id)?.map((section) => (
                <TreeNode
                  key={section.id}
                  label={section.title}
                  icon={<FolderIcon />}
                  expanded={expandedSections.has(section.id)}
                  hasChildren={(section.entryCount ?? 0) > 0}
                  count={section.entryCount}
                  depth={2}
                  onClick={() => toggleSection(section)}
                  onToggle={() => toggleSection(section)}
                >
                  {/* Entries */}
                  {loadedEntries.get(section.id)?.map((entry) => (
                    <TreeNode
                      key={entry.id}
                      label={entry.title || 'Untitled Entry'}
                      icon={<FileIcon />}
                      selected={selectedEntryId === entry.id}
                      hasChildren={false}
                      depth={3}
                      onClick={() => handleEntryClick(entry)}
                    />
                  ))}
                </TreeNode>
              ))}
            </TreeNode>
          ))}
        </TreeNode>
      ))}
    </div>
  );
}

export default RulesBrowser;
