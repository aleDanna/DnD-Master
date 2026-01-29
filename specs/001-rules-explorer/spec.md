# Feature Specification: Rules Explorer

**Feature Branch**: `001-rules-explorer`
**Created**: 2026-01-29
**Status**: Draft
**Input**: User description: "Add a Rules Explorer menu item to browse, search, and reference D&D rules extracted from PDF/TXT source documents. Store rules in Supabase with vector embeddings for semantic search. AI DM should cite rules during sessions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Rules by Chapter (Priority: P1)

As a DM or player, I want to browse game rules organized by chapter and section hierarchy so that I can quickly find rules by navigating a familiar table-of-contents structure.

**Why this priority**: This is the foundational navigation pattern. Without hierarchical browsing, users have no structured way to explore rules. It mirrors how physical rulebooks work, providing immediate familiarity.

**Independent Test**: Can be fully tested by opening the Rules Explorer, seeing a list of chapters, clicking a chapter to see sections, and clicking a section to view rule content. Delivers value as a standalone digital rulebook browser.

**Acceptance Scenarios**:

1. **Given** the user opens the Rules Explorer, **When** the page loads, **Then** a sidebar displays all top-level chapters from ingested documents grouped by source book.
2. **Given** the user clicks on a chapter, **When** the chapter expands, **Then** all sections within that chapter are displayed as nested items.
3. **Given** the user clicks on a section, **When** the section is selected, **Then** the main content area displays the full rule text with source citation (book, chapter, page).
4. **Given** multiple source documents exist, **When** the user views the chapter list, **Then** chapters are grouped under their respective source document headers.

---

### User Story 2 - Full-Text Search (Priority: P1)

As a DM or player, I want to search rules using keywords so that I can quickly find specific rules by name or term without browsing.

**Why this priority**: Search is essential for quick reference during gameplay. Combined with browsing (US1), it provides complete rules access. Full-text search is simpler to implement than semantic and provides exact matches.

**Independent Test**: Can be tested by typing "attack of opportunity" in the search bar and verifying matching rules appear with highlighted keywords. Delivers immediate lookup value.

**Acceptance Scenarios**:

1. **Given** the user is on the Rules Explorer page, **When** they type a query in the search bar and press Enter, **Then** matching rules are displayed as a list with the search term highlighted in context.
2. **Given** the search returns results, **When** the user clicks a result, **Then** the full rule content is displayed with the search term highlighted.
3. **Given** no rules match the search query, **When** results are displayed, **Then** a "No results found" message appears with a suggestion to try semantic search.
4. **Given** the user has entered a search query, **When** they clear the search bar, **Then** the view returns to the chapter browse mode.

---

### User Story 3 - Semantic Search (Priority: P2)

As a DM or player, I want to search rules using natural language questions so that I can find relevant rules even when I don't know the exact terminology.

**Why this priority**: Semantic search differentiates this from a simple PDF viewer. It enables queries like "what happens when I fall from a height?" to find falling damage rules. Requires vector embeddings infrastructure.

**Independent Test**: Can be tested by entering "how do I break free from being grabbed" and verifying grapple escape rules appear, even though the query doesn't use the word "grapple."

**Acceptance Scenarios**:

1. **Given** the user toggles "Smart Search" mode, **When** they enter a natural language question, **Then** semantically relevant rules are returned ranked by relevance score.
2. **Given** semantic search is active, **When** results are displayed, **Then** each result shows a relevance indicator and the specific passage that matched the query intent.
3. **Given** the user performs a semantic search, **When** no highly relevant results exist, **Then** the system displays partial matches with lower confidence indicators.

---

### User Story 4 - AI DM Rules Citation (Priority: P2)

As a player in an active session, I want the AI DM to automatically cite relevant rules when making mechanical rulings so that I can verify decisions and learn the rules.

**Why this priority**: This integrates the Rules Knowledge Base with the core AI DM functionality, fulfilling the Constitution's Rules-Grounded DM principle. Depends on US1-3 being complete.

**Independent Test**: Can be tested by asking the AI DM "can I attack twice?" during a session and verifying the response includes a citation link to the Extra Attack or Multiattack rule.

**Acceptance Scenarios**:

1. **Given** the AI DM is resolving a mechanical question, **When** the response is generated, **Then** relevant rule citations appear as clickable links within the response.
2. **Given** a citation link is clicked, **When** the user interacts with it, **Then** a popover or side panel displays the full rule text without leaving the session view.
3. **Given** multiple rules apply to a ruling, **When** the AI DM responds, **Then** all applicable rules are cited with brief explanations of how each applies.

---

### User Story 5 - Document Ingestion (Priority: P1 - Admin Only)

As a system administrator, I want to ingest PDF and TXT rulebook documents so that the rules database is populated with searchable content.

**Why this priority**: Without ingestion, there are no rules to browse or search. This is a prerequisite for all other stories but is admin-only functionality, not end-user facing.

**Independent Test**: Can be tested by uploading a test PDF, running ingestion, and verifying chapters/sections appear in the database with correct hierarchy and embeddings.

**Acceptance Scenarios**:

1. **Given** an admin uploads a PDF document, **When** ingestion is triggered, **Then** the system extracts text, identifies chapter/section structure, and creates rule entries in the database.
2. **Given** a document is being ingested, **When** processing completes, **Then** vector embeddings are generated for each rule chunk and stored for similarity search.
3. **Given** a document was previously ingested, **When** the same document is re-uploaded, **Then** the system detects the duplicate and prompts for confirmation before replacing existing entries.
4. **Given** ingestion encounters parsing errors, **When** errors occur, **Then** a detailed error log is generated identifying problematic sections.

---

### Edge Cases

- What happens when a search query matches hundreds of rules? → Paginate results (20 per page) with "load more" functionality.
- How does the system handle rules that span multiple pages in the source PDF? → Merge content during ingestion, preserve full page range in citation.
- What happens if the AI DM cannot find a relevant rule? → AI explicitly states "I could not find a specific rule for this situation" and offers to make a ruling based on general principles.
- How does the system handle tables and stat blocks in PDFs? → Extract as structured data where possible; fall back to formatted text preservation.
- What happens during search if semantic search is unavailable? → Graceful degradation to full-text search only with user notification.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST parse PDF documents and extract text content preserving paragraph structure.
- **FR-002**: System MUST parse TXT documents and extract text content.
- **FR-003**: System MUST identify chapter and section boundaries in source documents using heading detection and formatting cues.
- **FR-004**: System MUST store extracted rules in a structured database schema with hierarchy relationships.
- **FR-005**: System MUST generate vector embeddings for each rule chunk using a text embedding model.
- **FR-006**: System MUST store embeddings for similarity search.
- **FR-007**: System MUST provide full-text search across all rule content.
- **FR-008**: System MUST provide semantic search using vector similarity queries.
- **FR-009**: System MUST display rules with source citations including document name, chapter, and section.
- **FR-010**: System MUST provide a hierarchical navigation UI for browsing rules by chapter/section.
- **FR-011**: System MUST integrate with AI DM to enable rule queries during session responses.
- **FR-012**: AI DM responses involving mechanics MUST include clickable citations to relevant rules.
- **FR-013**: System MUST support hybrid search combining full-text and semantic results.

### Key Entities

- **SourceDocument**: Represents an ingested rulebook. Attributes: id, name, file_type, ingested_at, total_pages, checksum.
- **RuleChapter**: Top-level organizational unit. Attributes: id, source_document_id, title, order_index, page_start.
- **RuleSection**: Sub-section within a chapter. Attributes: id, chapter_id, title, order_index, page_start.
- **RuleEntry**: Individual rule content chunk. Attributes: id, section_id, content, content_embedding (vector), page_reference, source_quote.
- **RuleCategory**: Optional tagging for cross-cutting organization. Attributes: id, name, description. Many-to-many relationship with RuleEntry.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can find any specific rule within 10 seconds using either browse or search.
- **SC-002**: Semantic search returns relevant results for natural language queries with >80% relevance accuracy (measured by user feedback sampling).
- **SC-003**: Full-text search returns exact matches with <500ms response time for 95th percentile queries.
- **SC-004**: 100% of AI DM mechanical rulings include at least one rule citation when a relevant rule exists in the database.
- **SC-005**: Document ingestion processes a 300-page PDF in under 5 minutes.
- **SC-006**: Zero data loss of rule content between source document and stored entries (validated by spot-check audits).
