interface ReferenceItem {
  type: 'image' | 'document' | 'link';
  title: string;
  url: string;
  description?: string;
  keywords: string[];
}

interface ReferenceMap {
  [key: string]: ReferenceItem;
}

class ReferenceService {
  private referenceMap: ReferenceMap = {};

  async initialize() {
    try {
      const response = await fetch('/assets/references/reference-map.json');
      this.referenceMap = await response.json();
      console.log('Loaded referenceMap:', this.referenceMap);
    } catch (error) {
      console.error('Error loading reference map:', error);
    }
  }

  findReferences(content: string): ReferenceItem[] {
    const normalizedContent = content.toLowerCase();
    const matches: ReferenceItem[] = [];

    // Check each reference item for matching keywords
    Object.values(this.referenceMap).forEach(item => {
      const hasMatch = item.keywords.some(keyword => 
        normalizedContent.includes(keyword.toLowerCase())
      );

      if (hasMatch && !matches.find(m => m.url === item.url)) {
        matches.push(item);
      }
    });

    return matches;
  }

  async addReference(key: string, reference: ReferenceItem) {
    this.referenceMap[key] = reference;
    // Optionally save to backend
    try {
      await fetch('/api/references', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...reference,
          id: key
        })
      });
    } catch (error) {
      console.error('Error saving reference:', error);
    }
  }
}

export const referenceService = new ReferenceService();
export type { ReferenceItem, ReferenceMap }; 