import { type TextCharacteristics } from '../types/detection';

export function analyzeTextCharacteristics(text: string): TextCharacteristics {
  const characteristics = {
    hasHistoricalLanguage: /thou|thee|thy|hast|doth|whence|wherefore|forsooth|prithee/i.test(text),
    hasComplexMetaphors: /(like|as) a .+(?=,|\.|;).*(?:but|yet|though)/i.test(text),
    hasEmotionalDepth: /heart|soul|spirit|passion|love|hate|fear|joy|sorrow/i.test(text),
    hasIrregularStructure: text.split(/[.!?]/).some(sentence => 
      sentence.length > 100 || sentence.includes(';') || sentence.includes(':')
    ),
    hasUniqueImagery: /[a-z]+(?:ing|ed) like [a-z]+/i.test(text),
    isModernLanguage: /computer|internet|digital|online|technology|software/i.test(text)
  };

  return characteristics;
}