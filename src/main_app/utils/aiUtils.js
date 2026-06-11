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
  const prefix = "I'm asking about this text:";
  if (content.startsWith(prefix)) {
    const questionMarker = "\n\nMy question: ";
    const questionIndex = content.indexOf(questionMarker);
    if (questionIndex !== -1) {
      return content.substring(questionIndex + questionMarker.length).trim();
    }
    // Fallback: strip the prefix and optional wrapping quotes/dots
    let rest = content.substring(prefix.length).trim();
    if (rest.startsWith('"')) {
      rest = rest.substring(1);
    }
    // Remove trailing quotes/dots
    rest = rest.replace(/"\s*\.{0,3}$/, '...');
    return rest;
  }
  return content;
}

/**
 * Parses a user message content to extract highlighted context and the question.
 */
export function extractContextAndQuestion(content) {
  if (!content) return { context: null, question: '' };
  
  const prefix = "I'm asking about this text:";
  if (content.startsWith(prefix)) {
    const questionMarker = "\n\nMy question: ";
    const questionIndex = content.indexOf(questionMarker);
    if (questionIndex !== -1) {
      // Extract context between quotes
      let contextPart = content.substring(prefix.length, questionIndex).trim();
      if (contextPart.startsWith('"') && contextPart.endsWith('"')) {
        contextPart = contextPart.substring(1, contextPart.length - 1);
      }
      const questionPart = content.substring(questionIndex + questionMarker.length).trim();
      return { context: contextPart, question: questionPart };
    }
  }
  return { context: null, question: content };
}

/**
 * Returns a cleaned chat title, extracting from the first user message
 * if the stored title contains the hidden prompt context prefix.
 */
export function getChatTitle(chat) {
  if (!chat) return 'New Chat';
  
  // If the title is clean (doesn't start with the hidden prompt prefix), use it
  if (chat.title && !chat.title.startsWith("I'm asking about this text:")) {
    return chat.title;
  }
  
  // Try to find the first user message and clean it to generate a title
  const firstUserMsg = chat.messages?.find(m => m.role === 'user');
  if (firstUserMsg) {
    const clean = cleanUserMessage(firstUserMsg.content);
    if (clean) {
      return clean.length > 40 ? clean.slice(0, 40) + '...' : clean;
    }
  }
  
  // Fallback to cleaning the title itself if no messages are found
  if (chat.title) {
    return cleanUserMessage(chat.title);
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
