import dictionaryData from './dictionary/dictionary.json';

export interface DictionaryEntry {
  keyword: string;
  fragments: string[];
  type: 'word' | 'phrase' | 'name';
}

// Thêm flag để bật/tắt logging
export const ENABLE_DICTIONARY_LOGGING = true;

export const loadDictionary = async (): Promise<DictionaryEntry[]> => {
  try {
    return dictionaryData.entries as DictionaryEntry[];
  } catch (error) {
    console.error('Error loading dictionary:', error);
    return [];
  }
};

export const findInDictionary = (fragments: string[]): DictionaryEntry | null => {
  if (ENABLE_DICTIONARY_LOGGING) {
    console.log('🔍 Checking fragments:', fragments);
  }

  // Kết hợp các fragment thành chuỗi để so sánh
  const searchStr = fragments.join('').toLowerCase().replace(/[-\s]/g, '');
  
  if (ENABLE_DICTIONARY_LOGGING) {
    console.log('📝 Normalized search string:', searchStr);
  }
  
  // Tìm trong dictionary
  const match = (dictionaryData.entries as DictionaryEntry[]).find(entry => {
    // Chuẩn hóa keyword để so sánh
    const normalizedKeyword = entry.keyword.toLowerCase().replace(/[-\s]/g, '');
    
    if (ENABLE_DICTIONARY_LOGGING) {
      console.log(`\n📖 Checking against dictionary entry: "${entry.keyword}"`);
      console.log('   Normalized keyword:', normalizedKeyword);
    }

    // So sánh trực tiếp chuỗi đã chuẩn hóa
    if (searchStr === normalizedKeyword) {
      if (ENABLE_DICTIONARY_LOGGING) {
        console.log('✅ Exact match found!');
      }
      return true;
    }

    // Kiểm tra xem searchStr có chứa trong normalizedKeyword không
    if (normalizedKeyword.includes(searchStr) || searchStr.includes(normalizedKeyword)) {
      if (ENABLE_DICTIONARY_LOGGING) {
        console.log('✅ Partial match found!');
      }
      return true;
    }

    // Tạo một sliding window để tìm các phần của từ
    let currentFragment = '';
    for (const fragment of fragments) {
      currentFragment += fragment.toLowerCase();
      if (ENABLE_DICTIONARY_LOGGING) {
        console.log('   Building fragment:', currentFragment);
      }
      if (normalizedKeyword.includes(currentFragment)) {
        // Nếu tìm thấy một phần của từ, tiếp tục tích lũy
        continue;
      }
      // Reset nếu không tìm thấy match
      currentFragment = fragment.toLowerCase();
    }
    
    // Kiểm tra kết quả cuối cùng
    const isMatch = currentFragment === normalizedKeyword;
    if (isMatch && ENABLE_DICTIONARY_LOGGING) {
      console.log('✅ Sliding window match found!');
    }
    return isMatch;
  }) || null;

  if (ENABLE_DICTIONARY_LOGGING) {
    if (match) {
      console.log('\n🎯 Final match found:', match.keyword);
    } else {
      console.log('\n❌ No match found in dictionary');
    }
  }

  return match;
};

// Helper function để thêm entry mới vào dictionary
export const addToDictionary = (entry: DictionaryEntry) => {
  (dictionaryData.entries as DictionaryEntry[]).push(entry);
  if (ENABLE_DICTIONARY_LOGGING) {
    console.log('📚 Added new entry to dictionary:', entry);
  }
}; 