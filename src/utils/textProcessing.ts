import { englishDictionary } from './dictionary/englishDictionary';
import { findInDictionary } from './dictionary';

interface ProcessTextResult {
  words: string[];
  positions: number[];
}

// Hàm kiểm tra từ hợp lệ
function isValidWord(word: string): boolean {
  return englishDictionary.has(word.toLowerCase()) || !!findInDictionary(word);
}

// Hàm tách camelCase/PascalCase thành các từ riêng biệt
function splitCamelCase(text: string): string {
  // Tách trước các chữ hoa không ở đầu chuỗi, ví dụ: "MiNhonHotel" => "Mi Nhon Hotel"
  return text.replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Cải tiến: Maximum matching đệ quy, ưu tiên tách ra nhiều từ hợp lệ nhất
function segmentText(text: string, start: number): { words: string[]; positions: number[] } {
  if (start >= text.length) return { words: [], positions: [] };
  let bestResult: { words: string[]; positions: number[] } = { words: [text.slice(start)], positions: [start] };

  for (let end = text.length; end > start; end--) {
    const word = text.slice(start, end);
    if (isValidWord(word)) {
      // Đệ quy tách phần còn lại
      const rest = segmentText(text, end);
      const candidate = {
        words: [word, ...rest.words],
        positions: [start, ...rest.positions]
      };
      // Ưu tiên phương án có nhiều từ hợp lệ nhất
      if (candidate.words.length > bestResult.words.length ||
          (candidate.words.length === bestResult.words.length && word.length > bestResult.words[0].length)) {
        bestResult = candidate;
      }
    }
  }
  return bestResult;
}

// Xử lý text bằng thuật toán maximum matching cải tiến, có tách camelCase
export function processText(text: string): ProcessTextResult {
  // Tiền xử lý: tách camelCase/PascalCase
  const preprocessed = splitCamelCase(text);
  // Có thể chuyển về lowercase nếu muốn, ví dụ: preprocessed = preprocessed.toLowerCase();
  // Bỏ qua khoảng trắng dư thừa
  const normalized = preprocessed.replace(/\s+/g, ' ').trim();
  // Áp dụng maximum matching cho từng từ/cụm
  const tokens = normalized.split(' ');
  let words: string[] = [];
  let positions: number[] = [];
  let pos = 0;
  for (const token of tokens) {
    if (!token) continue;
    const seg = segmentText(token, 0);
    words = words.concat(seg.words);
    // Ghi lại vị trí bắt đầu của từng từ (tương đối)
    for (let i = 0; i < seg.words.length; i++) {
      positions.push(pos);
      pos += seg.words[i].length;
    }
    pos += 1; // cho dấu cách
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
    if (/\[\({]$/.test(result)) {
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