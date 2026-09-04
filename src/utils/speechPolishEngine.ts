// Natural, voice-to-journal speech cleanup engine
// Converts raw speech recognition output into natural, readable journal prose
// with proper punctuation, sentence capitalization, filler removal, and minor grammar fixes.

export function polishSpeechLocally(rawText: string, _language: string = 'en-US'): string {
  if (!rawText || !rawText.trim()) return '';

  let text = rawText.trim();

  // 1. Remove obvious hesitation filler words when used as verbal pauses
  // e.g., "um", "uh", "erm", "ah", "you know", "like" (when filler)
  text = text.replace(/\b(um+|uh+|erm+|ahh?)\b/gi, ' ');
  text = text.replace(/\b(you know)\b(?=\s*,|\s+[a-z])/gi, ' ');
  // "like" when used as filler at start of clause or surrounded by pauses
  text = text.replace(/(^|[,.]\s*)like\s+/gi, '$1');
  text = text.replace(/\s+like\s+(?=today|yesterday|tomorrow|in\s|i\s|at\s|we\s|when\s|because\s)/gi, ' ');

  // 2. Fix common spoken grammar omissions in journaling speech
  // e.g. "was little sad" -> "was a little sad", "evening i went" -> "in the evening, I went", "today i was" -> "Today, I was"
  text = text.replace(/\bwas\s+little\s+(sad|happy|tired|upset|stressed|anxious|angry|worried|confused|down|better)\b/gi, 'was a little $1');
  text = text.replace(/\bfelt\s+little\s+(sad|happy|tired|upset|stressed|anxious|angry|worried|confused|down|better)\b/gi, 'felt a little $1');
  text = text.replace(/\b(but|and)\s+evening\b/gi, '$1 in the evening,');
  text = text.replace(/\b(in\s+evening)\b/gi, 'in the evening');
  text = text.replace(/\b(in\s+morning)\b/gi, 'in the morning');
  text = text.replace(/\b(in\s+afternoon)\b/gi, 'in the afternoon');

  // 3. Clean up multiple spaces
  text = text.replace(/\s{2,}/g, ' ').trim();

  // 4. Split run-on speech into natural sentences using clause transition words
  // Common sentence boundary words in conversational speech:
  // "i think i was", "i felt", "then", "after that", "but in the evening", "later on"
  text = text.replace(/\s+(i think\s+[a-z])/gi, '. $1');
  text = text.replace(/\s+(but in the evening)/gi, '. But in the evening');
  text = text.replace(/\s+(however\b)/gi, '. However,');
  text = text.replace(/\s+(after that\b)/gi, '. After that,');
  text = text.replace(/\s+(later on\b)/gi, '. Later on,');

  // Add commas before coordinating conjunctions when connecting clauses if comma not already present
  text = text.replace(/([a-zA-Z0-9])\s+(because)\s+/gi, '$1 because ');
  text = text.replace(/([a-zA-Z0-9])\s+(but)\s+(?!in the evening)/gi, '$1, but ');

  // Handle "today i was" / "today" at start
  text = text.replace(/^today\s+(i\s+was\b|[a-z]+\s+was\b)/i, 'Today, $1');
  text = text.replace(/^yesterday\s+(i\s+was\b|[a-z]+\s+was\b)/i, 'Yesterday, $1');

  // 5. Capitalize "I" and contractions
  text = text.replace(/\bi\b/g, 'I');
  text = text.replace(/\bi'm\b/g, "I'm");
  text = text.replace(/\bi'll\b/g, "I'll");
  text = text.replace(/\bi've\b/g, "I've");
  text = text.replace(/\bi'd\b/g, "I'd");

  // 6. Sentence capitalization: Capitalize the first letter of each sentence
  const sentences = text.split(/([.!?]+(?:\s+|$))/).filter(Boolean);
  let formatted = '';

  for (let i = 0; i < sentences.length; i++) {
    const chunk = sentences[i];
    if (/[.!?]/.test(chunk)) {
      formatted += chunk;
    } else {
      const trimmed = chunk.trim();
      if (trimmed.length > 0) {
        const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        formatted += capitalized;
      }
    }
  }

  // 7. Final punctuation guarantee
  let finalResult = formatted.trim();
  if (finalResult && !/[.!?]$/.test(finalResult)) {
    finalResult += '.';
  }

  // Clean any accidental punctuation spacing: e.g. " , " -> ", " or " . " -> ". "
  finalResult = finalResult.replace(/\s+([,.:;!?])/g, '$1');
  finalResult = finalResult.replace(/([,.:;!?])(?=[a-zA-Z0-9])/g, '$1 ');
  finalResult = finalResult.replace(/\.{2,}/g, '.');

  return finalResult;
}
