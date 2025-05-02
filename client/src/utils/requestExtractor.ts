export interface ExtractedRequest {
  type: string;
  text: string;
  details: Record<string, string>;
}

const REQUEST_PATTERNS = [
  /List of Requests:([\s\S]*?)(?:\n\nSpecial Instructions|\n\nThe conversation|$)/,
  /Requests?:([\s\S]*?)(?:\n\n|$)/,
  /Service Required:([\s\S]*?)(?:\n\n|$)/,
  /Service Type\(s\):([\s\S]*?)(?:\n\n|$)/
];

const DETAIL_PATTERNS = {
  time: /(?:time|timing|schedule):\s*([^,\n]+)/i,
  date: /(?:date|day|scheduled for):\s*([^,\n]+)/i,
  location: /(?:location|place|where):\s*([^,\n]+)/i,
  people: /(?:people|guests|persons):\s*(\d+)/i,
  amount: /(?:amount|quantity|qty):\s*([^,\n]+)/i,
  roomNumber: /(?:room|room number):\s*([^,\n]+)/i
};

function extractDetails(text: string): Record<string, string> {
  const details: Record<string, string> = {};
  
  Object.entries(DETAIL_PATTERNS).forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match) {
      details[key] = match[1].trim();
    }
  });
  
  // Extract any other details that don't match the patterns
  const otherDetails = text
    .split('\n')
    .filter(line => line.includes(':') && !Object.values(DETAIL_PATTERNS).some(pattern => pattern.test(line)))
    .map(line => line.trim())
    .join('\n');
    
  if (otherDetails) {
    details.otherDetails = otherDetails;
  }
  
  return details;
}

export function extractRequests(content: string): ExtractedRequest[] {
  let requestSection = '';
  
  // Try each pattern until we find a match
  for (const pattern of REQUEST_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      requestSection = match[1].trim();
      break;
    }
  }
  
  // If no pattern matched, try to process the entire content
  if (!requestSection) {
    requestSection = content;
  }
  
  // Split into individual requests
  const requests = requestSection
    .split(/\n(?=Request \d+:|Service \d+:|[1-9]\.|[-•])/g)
    .filter(Boolean)
    .map(req => req.trim());
  
  return requests.map(req => {
    // Try to extract service type
    const typeMatch = req.match(/^(?:Request \d+:|Service \d+:|[1-9]\.|-|•)\s*([^:\n]+):/);
    const type = typeMatch ? typeMatch[1].trim() : 'General Request';
    
    // Clean up the request text
    const text = req
      .replace(/^(?:Request \d+:|Service \d+:|[1-9]\.|-|•)\s*[^:\n]+:\s*/, '')
      .trim();
    
    return {
      type,
      text,
      details: extractDetails(text)
    };
  });
}

export function validateRequest(request: ExtractedRequest): boolean {
  return (
    request.type.length > 0 &&
    request.text.length > 0 &&
    Object.keys(request.details).length > 0
  );
}

export function normalizeRequestType(type: string): string {
  const normalized = type.toLowerCase().trim();
  
  // Map common variations to standard types
  const typeMap: Record<string, string> = {
    'room service': 'room-service',
    'housekeeping': 'housekeeping',
    'cleaning': 'housekeeping',
    'food': 'room-service',
    'beverage': 'room-service',
    'transport': 'transportation',
    'taxi': 'transportation',
    'shuttle': 'transportation',
    'spa': 'spa',
    'massage': 'spa',
    'tour': 'tours-activities',
    'activity': 'tours-activities',
    'technical': 'technical-support',
    'wifi': 'technical-support',
    'concierge': 'concierge',
    'information': 'concierge',
    'gym': 'wellness-fitness',
    'fitness': 'wellness-fitness',
    'security': 'security',
    'lost': 'security',
    'special': 'special-occasions',
    'celebration': 'special-occasions'
  };
  
  // Find the best match in the type map
  for (const [key, value] of Object.entries(typeMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'other';
} 