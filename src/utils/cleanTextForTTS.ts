export function cleanTextForTTS(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');
  
  // Remove markdown headers (# ## ###)
  cleaned = cleaned.replace(/^#+\s+/gm, '');
  
  // Remove markdown bold/italic (**text**, *text*, __text__, _text_)
  cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
  
  // Remove markdown links [text](url) -> keep only text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove markdown code blocks (```code```)
  cleaned = cleaned.replace(/```[^`]*```/g, ' ');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // Remove markdown horizontal rules (---, ___, ***)
  cleaned = cleaned.replace(/^[\-\_\*]{3,}$/gm, ' ');
  
  // Remove markdown list markers (-, *, 1., 2., etc.)
  cleaned = cleaned.replace(/^\s*[\-\*\+]\s+/gm, '');
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');
  
  // Remove or simplify emojis
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, ' '); // Emoticons
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ' '); // Symbols & pictographs
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ' '); // Transport & map
  cleaned = cleaned.replace(/[\u{1F700}-\u{1F77F}]/gu, ' '); // Alchemical
  cleaned = cleaned.replace(/[\u{1F780}-\u{1F7FF}]/gu, ' '); // Geometric Shapes
  cleaned = cleaned.replace(/[\u{1F800}-\u{1F8FF}]/gu, ' '); // Supplemental Arrows
  cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, ' '); // Supplemental Symbols
  cleaned = cleaned.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ' '); // Chess Symbols
  cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ' '); // Symbols and Pictographs Extended-A
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, ' ');   // Misc symbols
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, ' ');   // Dingbats
  
  // Remove blockquote markers (>)
  cleaned = cleaned.replace(/^\s*>\s+/gm, '');
  
  // Remove excessive punctuation (multiple !, ?, etc.)
  cleaned = cleaned.replace(/([!?.]){2,}/g, '$1');
  
  // Remove standalone special characters that TTS reads literally
  cleaned = cleaned.replace(/[\{\}\[\]\(\)<>]/g, ' ');
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();
  
  return cleaned;
}
