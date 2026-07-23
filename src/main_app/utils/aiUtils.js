/**
 * aiUtils.js
 * Central utility helpers for Apex AI rendering and parsing.
 */

/**
 * Strips the hidden prompt from user query text if it exists.
 * Hidden prompt format: I'm asking about this text: "<context>"\n\nMy question: <question>
 */
export function cleanUserMessage(content) {
  if (!content) return '';

  let text = content;

  // 1. If "My Question: " or "My question: " marker exists, extract the question after it
  const questionMarkerMatch = text.match(/\n\nMy [Qq]uestion:\s*/);
  if (questionMarkerMatch) {
    const idx = questionMarkerMatch.index + questionMarkerMatch[0].length;
    text = text.substring(idx).trim();
  }

  // 2. Strip <page>...</page> blocks and "Current page content:"
  text = text.replace(/Current page content:\s*<page>[\s\S]*?<\/page>/gi, '');
  text = text.replace(/<page>[\s\S]*?<\/page>/gi, '');

  // 3. Strip "Student is preparing for: ..."
  text = text.replace(/Student is preparing for:.*$/gmi, '');

  // 4. Strip highlighted text prefixes/wrappers if still present
  const prefixPatterns = [
    /^I am asking about the following highlighted text:\s*<context>[\s\S]*?<\/context>/i,
    /^I'm asking about this text:\s*"[\s\S]*?"/i,
    /^I'm asking about this text:\s*/i,
    /^I am asking about the following highlighted text:\s*/i,
  ];

  for (const pattern of prefixPatterns) {
    text = text.replace(pattern, '');
  }

  return text.trim();
}

/**
 * Parses a user message content to extract highlighted context and the question.
 */
export function extractContextAndQuestion(content) {
  if (!content) return { context: null, question: '' };
  
  let context = null;

  // Check for <context>...</context>
  const contextMatch = content.match(/<context>([\s\S]*?)<\/context>/i);
  if (contextMatch) {
    context = contextMatch[1].trim();
  } else {
    // Check for "I'm asking about this text: \"...\""
    const legacyPrefixMatch = content.match(/I'm asking about this text:\s*"([\s\S]*?)"/i);
    if (legacyPrefixMatch) {
      context = legacyPrefixMatch[1].trim();
    }
  }

  const question = cleanUserMessage(content);
  return { context, question };
}

/**
 * Returns a cleaned chat title, extracting from the first user message
 * or cleaning the stored title if it contains system prompts or hidden context.
 */
export function getChatTitle(chat) {
  if (!chat) return 'New Chat';
  
  // 1. Try first user message if available
  const firstUserMsg = chat.messages?.find(m => m.role === 'user');
  if (firstUserMsg) {
    const clean = cleanUserMessage(firstUserMsg.content);
    if (clean) {
      return clean.length > 40 ? clean.slice(0, 40) + '...' : clean;
    }
  }
  
  // 2. Fallback to cleaning the stored title
  if (chat.title) {
    const clean = cleanUserMessage(chat.title);
    if (clean) {
      return clean.length > 40 ? clean.slice(0, 40) + '...' : clean;
    }
  }
  
  return 'New Chat';
}

/**
 * Strips basic markdown syntax from a string to return clean plain text,
 * suitable for chat previews/snippets.
 */
export function stripMarkdown(text) {
  if (!text) return '';
  return text
    // Remove bold and italic formatting characters (e.g. **bold**, *italic*)
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove inline code formatting (e.g. `code`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove headers (e.g. # Header)
    .replace(/#+\s+(.*?)(?=\n|$)/g, '$1')
    // Remove list markers (e.g. - item, * item, 1. item)
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove link syntax but keep label (e.g. [label](url))
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    // Collapse multiple spaces or newlines to a single space
    .replace(/\s+/g, ' ')
    .trim();
}
