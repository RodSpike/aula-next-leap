// Common Portuguese words and phrases for detection
const PORTUGUESE_WORDS = new Set([
  // Basic words
  'por', 'favor', 'obrigado', 'obrigada', 'sim', 'não', 'nao', 'como', 'onde', 'quando', 'que', 'o', 'a', 'os', 'as',
  'um', 'uma', 'de', 'da', 'do', 'para', 'com', 'em', 'na', 'no', 'eu', 'você', 'voce', 'ele', 'ela', 'nós', 'nos',
  
  // Learning/Education related
  'ensine', 'ensinar', 'aprender', 'estudar', 'explicar', 'explique', 'ajude', 'ajudar', 'entender', 'compreender',
  'dúvida', 'duvida', 'pergunta', 'questão', 'questao', 'lição', 'licao', 'aula', 'professor', 'professora',
  
  // Common verbs
  'ser', 'estar', 'ter', 'fazer', 'ir', 'vir', 'dar', 'ver', 'saber', 'poder', 'querer', 'dizer', 'falar',
  'conhecer', 'trabalhar', 'morar', 'gostar', 'precisar', 'conseguir', 'começar', 'comecar', 'terminar',
  
  // Common phrases
  'me', 'meu', 'minha', 'seus', 'suas', 'dele', 'dela', 'nosso', 'nossa', 'muito', 'mais', 'menos', 'bem',
  'mal', 'hoje', 'ontem', 'amanhã', 'amanha', 'agora', 'depois', 'antes', 'sempre', 'nunca', 'já', 'ja',
  
  // Question words
  'qual', 'quais', 'quem', 'quanto', 'quantos', 'quantas', 'porque', 'por que', 'porquê', 'porquê',
  
  // Polite expressions
  'desculpe', 'desculpa', 'licença', 'licenca', 'com licença', 'com licenca', 'bom dia', 'boa tarde', 'boa noite'
])

// Portuguese-specific patterns
const PORTUGUESE_PATTERNS = [
  /\b(por favor|obrigad[oa]|desculp[ae]|com licen[cç]a)\b/gi,
  /\b(me ensine|me ajude|me explique)\b/gi,
  /\b(como|onde|quando|por que|porque) .+\?/gi,
  /\b(eu|você|voce|ele|ela) (sou|é|e|está|esta|tem|faz|vai|quer)\b/gi,
  /\b(meu|minha|seu|sua|nosso|nossa) .+/gi,
  /\b(muito|mais|menos) .+/gi
]

export function detectPortuguese(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  
  const cleanText = text.toLowerCase().trim()
  
  // Check for Portuguese patterns first (more specific)
  for (const pattern of PORTUGUESE_PATTERNS) {
    if (pattern.test(cleanText)) {
      return true
    }
  }
  
  // Check for Portuguese words
  const words = cleanText.split(/\s+/)
  let portugueseWordCount = 0
  
  for (const word of words) {
    // Remove punctuation for better matching
    const cleanWord = word.replace(/[.,!?;:()]/g, '')
    if (PORTUGUESE_WORDS.has(cleanWord)) {
      portugueseWordCount++
    }
  }
  
  // If more than 30% of words are Portuguese, consider it Portuguese
  const threshold = Math.max(1, Math.floor(words.length * 0.3))
  return portugueseWordCount >= threshold
}

export function hasPortugueseMixed(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  
  const hasPortuguese = detectPortuguese(text)
  
  // Check if it also contains English technical terms or common English words
  const englishTechnicalTerms = /\b(present perfect|past simple|future|grammar|vocabulary|pronunciation|speaking|listening|reading|writing|english|teacher|lesson|practice|exercise)\b/gi
  const hasEnglishTerms = englishTechnicalTerms.test(text)
  
  return hasPortuguese && (hasEnglishTerms || text.split(/\s+/).length > 2)
}