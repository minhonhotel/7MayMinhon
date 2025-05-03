import { englishDictionary } from './dictionary/englishDictionary';
import dictionaryData from './dictionary/dictionary.json';
import { wordBreaker } from 'word-breaker';

interface ProcessTextResult {
  words: string[];
  positions: number[];
}

// Chuẩn hóa text: lowercase, tách dấu câu, loại bỏ khoảng trắng dư thừa
function normalizeText(text: string): string {
  return text
    .replace(/([.,!?;:()"'-])/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Tạo set từ điển và tính maxPhraseLength
const phraseSet = new Set<string>();
let maxPhraseLength = 0;

// Thêm từ/cụm từ từ englishDictionary
englishDictionary.forEach(word => {
  const normalized = word.toLowerCase().replace(/\s+/g, '');
  phraseSet.add(normalized);
  if (normalized.length > maxPhraseLength) maxPhraseLength = normalized.length;
});

// Thêm phrase từ dictionary.json
if (dictionaryData.entries) {
  dictionaryData.entries.forEach((entry: any) => {
    const keyword = entry.keyword.toLowerCase().replace(/\s+/g, '');
    phraseSet.add(keyword);
    if (keyword.length > maxPhraseLength) maxPhraseLength = keyword.length;
  });
}

// Hàm tách từ theo forward maximum matching
function segmentByDictionary(text: string): string[] {
  const normalized = normalizeText(text).replace(/\s/g, ''); // Xóa khoảng trắng để tách dính liền
  let result: string[] = [];
  let i = 0;
  while (i < normalized.length) {
    let found = false;
    for (let len = Math.min(maxPhraseLength, normalized.length - i); len > 0; len--) {
      const fragment = normalized.substr(i, len);
      if (phraseSet.has(fragment)) {
        result.push(fragment);
        i += len;
        found = true;
        break;
      }
    }
    if (!found) {
      result.push(normalized[i]);
      i++;
    }
  }
  return result;
}

// Hàm processText mới: ưu tiên word-breaker, fallback về maximum matching nếu cần
export function processText(text: string): ProcessTextResult {
  // Sử dụng word-breaker cho tiếng Anh
  let words: string[] = [];
  try {
    // wordBreaker trả về mảng các từ đã tách
    words = wordBreaker(text);
    // Nếu word-breaker tách được nhiều hơn 1 từ, ưu tiên dùng
    if (words.length > 1) {
      // Tính vị trí bắt đầu của từng từ
      let positions: number[] = [];
      let pos = 0;
      for (const word of words) {
        positions.push(pos);
        pos += word.length + 1;
      }
      return { words, positions };
    }
  } catch (e) {
    // Nếu word-breaker lỗi, fallback về maximum matching
  }
  // Fallback: maximum matching
  words = segmentByDictionary(text);
  let positions: number[] = [];
  let pos = 0;
  for (const word of words) {
    positions.push(pos);
    pos += word.length + 1;
  }
  return { words, positions };
}

// Thêm khoảng trắng thông minh giữa các từ
export function applySmartSpacing(words: string[]): string {
  if (words.length === 0) return '';
  return words.join(' ');
} 