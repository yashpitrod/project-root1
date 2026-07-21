/**
 * markdownSplitter.js
 *
 * Markdown-header-aware text splitter.
 * Splits on H2 (##) and H3 (###) boundaries, preserving the section heading
 * as chunk metadata. Each section stays intact as one retrievable unit.
 * Falls back to character-count splitting only if a single section
 * exceeds MAX_CHUNK_CHARS (roughly ~800 tokens at ~4 chars/token).
 */

const MAX_CHUNK_CHARS = 3200; // ~800 tokens at 4 chars/token

/**
 * Split a markdown document into chunks respecting H2/H3 boundaries.
 *
 * @param {string} content   - Full markdown file content
 * @param {string} source    - Filename or label (e.g. "fever-flu.md")
 * @returns {Array<{text: string, metadata: {source: string, section: string, heading: string}}>}
 */
export function splitMarkdownByHeaders(content, source) {
  const chunks = [];

  // Extract the document title from H1 (# Title) if present
  const h1Match = content.match(/^#\s+(.+)$/m);
  const documentTitle = h1Match ? h1Match[1].trim() : source.replace(/\.md$/, "");

  // Split on H2 (##) and H3 (###) boundaries
  // Regex captures the delimiter (heading line) and the content after it
  const sectionPattern = /^(#{2,3}\s+.+)$/gm;

  // Find all section header positions
  const headerMatches = [];
  let match;
  while ((match = sectionPattern.exec(content)) !== null) {
    headerMatches.push({ index: match.index, heading: match[1].trim() });
  }

  if (headerMatches.length === 0) {
    // No H2/H3 sections — treat entire document as one chunk
    const cleaned = content.trim();
    if (cleaned.length > 0) {
      chunks.push(...splitIfTooLarge(cleaned, source, documentTitle, documentTitle));
    }
    return chunks;
  }

  // Handle any content before the first H2/H3 section (intro text under H1)
  const firstSectionStart = headerMatches[0].index;
  const introContent = content.slice(0, firstSectionStart).trim();
  if (introContent.length > 50) {
    // Only keep intro if it has meaningful content beyond just the H1 title
    const introLines = introContent.split("\n").filter(l => !l.startsWith("# "));
    const introText = introLines.join("\n").trim();
    if (introText.length > 30) {
      chunks.push(...splitIfTooLarge(
        `${documentTitle}\n\n${introText}`,
        source,
        `${documentTitle} > Introduction`,
        documentTitle
      ));
    }
  }

  // Process each section
  for (let i = 0; i < headerMatches.length; i++) {
    const currentHeader = headerMatches[i];
    const nextHeader = headerMatches[i + 1];

    const sectionStart = currentHeader.index;
    const sectionEnd = nextHeader ? nextHeader.index : content.length;
    const sectionContent = content.slice(sectionStart, sectionEnd).trim();

    // Parse heading level and text
    const headingText = currentHeader.heading.replace(/^#+\s+/, "").trim();
    const sectionLabel = `${documentTitle} > ${headingText}`;

    if (sectionContent.length > 0) {
      chunks.push(...splitIfTooLarge(sectionContent, source, sectionLabel, documentTitle));
    }
  }

  return chunks;
}

/**
 * If a section exceeds MAX_CHUNK_CHARS, split it on paragraph or sentence
 * boundaries. This is a fallback — in a well-structured KB at this scale
 * it should rarely trigger.
 *
 * @param {string} text
 * @param {string} source
 * @param {string} section
 * @param {string} heading
 * @returns {Array<{text: string, metadata: {source: string, section: string, heading: string}}>}
 */
function splitIfTooLarge(text, source, section, heading) {
  if (text.length <= MAX_CHUNK_CHARS) {
    return [{
      text,
      metadata: { source, section, heading },
    }];
  }

  // Split on double-newline (paragraph) boundaries
  const paragraphs = text.split(/\n\n+/);
  const subChunks = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk + "\n\n" + para).length > MAX_CHUNK_CHARS && currentChunk.length > 0) {
      subChunks.push({
        text: currentChunk.trim(),
        metadata: { source, section, heading },
      });
      currentChunk = para;
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + para : para;
    }
  }

  if (currentChunk.trim().length > 0) {
    subChunks.push({
      text: currentChunk.trim(),
      metadata: { source, section, heading },
    });
  }

  return subChunks;
}
