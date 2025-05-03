import { englishDictionary } from './dictionary/englishDictionary';
import { findInDictionary } from './dictionary';

interface ProcessTextResult {
  words: string[];
  positions: number[];
}

// Tìm từ dài nhất có thể từ vị trí start
export function findLongestWord(text: string, start: number): { word: string; end: number } | null {
  let end = start;
  let longestWord = '';
  let longestEnd = start;

  // Thử tất cả các độ dài có thể từ vị trí start
  while (end < text.length) {
    const currentWord = text.slice(start, end + 1);
    
    // Kiểm tra trong cả từ điển tiếng Anh và từ điển tùy chỉnh
    if (englishDictionary.has(currentWord.toLowerCase()) || findInDictionary(currentWord)) {
      longestWord = currentWord;
      longestEnd = end;
    }
    end++;
  }

  return longestWord ? { word: longestWord, end: longestEnd } : null;
}

// Xử lý text bằng thuật toán maximum matching
export function processText(text: string): ProcessTextResult {
  const words: string[] = [];
  const positions: number[] = [];
  let currentPos = 0;

  while (currentPos < text.length) {
    // Bỏ qua khoảng trắng
    if (/\s/.test(text[currentPos])) {
      currentPos++;
      continue;
    }

    // Xử lý dấu câu và số
    if (/[.,!?;:0-9]/.test(text[currentPos])) {
      words.push(text[currentPos]);
      positions.push(currentPos);
      currentPos++;
      continue;
    }

    // Tìm từ dài nhất có thể
    const result = findLongestWord(text, currentPos);
    if (result) {
      words.push(result.word);
      positions.push(currentPos);
      currentPos = result.end + 1;
    } else {
      // Nếu không tìm thấy từ nào, lấy một ký tự
      words.push(text[currentPos]);
      positions.push(currentPos);
      currentPos++;
    }
  }

  return { words, positions };
}

// Thêm khoảng trắng thông minh giữa các từ
export function applySmartSpacing(words: string[]): string {
  if (words.length === 0) return '';

  return words.reduce((result, word, index) => {
    if (index === 0) return word;

    // Không thêm space trước dấu câu
    if (/^[.,!?;:]/.test(word)) {
      return result + word;
    }

    // Không thêm space sau dấu mở ngoặc
    if (/[\[({]$/.test(result)) {
      return result + word;
    }

    // Không thêm space trước dấu đóng ngoặc
    if (/^[\])}]/.test(word)) {
      return result + word;
    }

    // Thêm space trong các trường hợp còn lại
    return result + ' ' + word;
  });
} 