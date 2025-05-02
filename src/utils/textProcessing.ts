import { englishDictionary } from './dictionary/englishDictionary';
import { findInDictionary } from './dictionary';

// Interface cho kết quả phân tích
interface TokenizeResult {
  words: string[];
  originalPositions: number[];
}

/**
 * Tìm từ dài nhất có thể từ vị trí start
 * @param text Chuỗi cần xử lý
 * @param start Vị trí bắt đầu
 * @returns Từ dài nhất tìm được và độ dài của nó
 */
function findLongestWord(text: string, start: number): { word: string; length: number } {
  let maxLength = 0;
  let longestWord = '';
  
  // Xử lý số và dấu câu đặc biệt
  const numberMatch = text.slice(start).match(/^\d+(:?\d+)?/);
  if (numberMatch) {
    return { word: numberMatch[0], length: numberMatch[0].length };
  }
  
  const punctMatch = text.slice(start).match(/^[.,!?;:'"-]/);
  if (punctMatch) {
    return { word: punctMatch[0], length: 1 };
  }
  
  // Thử các độ dài khác nhau từ vị trí start
  for (let length = 1; length <= Math.min(20, text.length - start); length++) {
    const word = text.slice(start, start + length).toLowerCase();
    
    // Kiểm tra trong từ điển tiếng Anh
    if (englishDictionary.has(word)) {
      maxLength = length;
      longestWord = word;
    }
    
    // Kiểm tra trong dictionary tùy chỉnh
    const dictMatch = findInDictionary([word]);
    if (dictMatch) {
      if (dictMatch.keyword.length > maxLength) {
        maxLength = dictMatch.keyword.length;
        longestWord = dictMatch.keyword;
      }
    }
  }
  
  return { word: longestWord, length: maxLength };
}

/**
 * Xử lý text bằng thuật toán maximum matching
 * @param text Chuỗi cần xử lý
 * @returns Mảng các từ đã được tách và vị trí gốc của chúng
 */
export function processText(text: string): TokenizeResult {
  const words: string[] = [];
  const originalPositions: number[] = [];
  let position = 0;
  
  while (position < text.length) {
    // Bỏ qua khoảng trắng
    if (text[position].trim() === '') {
      position++;
      continue;
    }
    
    // Tìm từ dài nhất có thể từ vị trí hiện tại
    const { word, length } = findLongestWord(text, position);
    
    if (length > 0) {
      // Tìm thấy từ trong từ điển
      // Giữ nguyên chữ hoa/thường của từ gốc nếu là tên riêng
      const originalWord = text.slice(position, position + length);
      const finalWord = englishDictionary.has(word.toLowerCase()) ? 
        (position === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word) :
        originalWord;
      
      words.push(finalWord);
      originalPositions.push(position);
      position += length;
    } else {
      // Không tìm thấy từ nào, giữ nguyên ký tự
      words.push(text[position]);
      originalPositions.push(position);
      position++;
    }
  }
  
  return { words, originalPositions };
}

/**
 * Áp dụng khoảng trắng thông minh giữa các từ
 * @param words Mảng các từ cần xử lý
 * @returns Chuỗi đã được thêm khoảng trắng
 */
export function applySmartSpacing(words: string[]): string {
  return words.reduce((result, word, index) => {
    if (index === 0) return word;
    
    const prevWord = words[index - 1];
    
    // Quy tắc đặc biệt cho số và đơn vị
    const isNumber = /^\d/.test(word);
    const isPrevNumber = /\d$/.test(prevWord);
    const isTimeUnit = /^(am|pm)$/i.test(word);
    const isSpecialChar = /^[.,!?;:'"-]/.test(word);
    const isPrevSpecialChar = /[.,!?;:'"-]$/.test(prevWord);
    
    const needsSpace = !isSpecialChar && // Không space trước dấu câu
                      !isPrevSpecialChar && // Không space sau dấu câu đặc biệt
                      !(isNumber && isPrevNumber) && // Không space giữa các số
                      !(isTimeUnit && isPrevNumber) && // Không space giữa số và AM/PM
                      !word.match(/^[-']/) && // Không space trước gạch nối/nháy đơn
                      !prevWord.match(/[-']$/); // Không space sau gạch nối/nháy đơn
    
    return result + (needsSpace ? ' ' : '') + word;
  }, '');
} 