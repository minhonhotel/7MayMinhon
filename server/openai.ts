import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY
});
const projectId = process.env.VITE_OPENAI_PROJECT_ID || "";

// Service category definitions for better classification
export const SERVICE_CATEGORIES = {
  'room-service': {
    name: 'Room Service',
    description: 'In-room dining, food and drinks delivered to guest rooms',
    keywords: ['food', 'drink', 'meal', 'breakfast', 'lunch', 'dinner', 'snack', 'water', 'coffee']
  },
  'food-beverage': {
    name: 'Food & Beverage',
    description: 'Restaurant reservations, bar service, special dining requests',
    keywords: ['restaurant', 'reservation', 'bar', 'dinner', 'lunch', 'table', 'booking']
  },
  'housekeeping': {
    name: 'Housekeeping',
    description: 'Room cleaning, linen change, additional amenities, laundry services',
    keywords: ['cleaning', 'clean', 'towel', 'bed', 'sheet', 'laundry', 'amenities']
  },
  'transportation': {
    name: 'Transportation',
    description: 'Taxi service, airport transfers, car rentals, shuttle services',
    keywords: ['taxi', 'car', 'shuttle', 'airport', 'transfer', 'pickup', 'transport']
  },
  'spa': {
    name: 'Spa',
    description: 'Massage appointments, spa treatments, wellness services',
    keywords: ['spa', 'massage', 'treatment', 'wellness', 'relax', 'therapy']
  },
  'tours-activities': {
    name: 'Tours & Activities',
    description: 'Tour bookings, excursions, sightseeing, activity arrangements',
    keywords: ['tour', 'activity', 'excursion', 'sightseeing', 'trip', 'booking', 'guide']
  },
  'technical-support': {
    name: 'Technical Support',
    description: 'WiFi issues, TV problems, electronic device assistance',
    keywords: ['wifi', 'internet', 'tv', 'remote', 'device', 'connection', 'technical']
  },
  'concierge': {
    name: 'Concierge Services',
    description: 'General information, recommendations, reservations for outside venues',
    keywords: ['concierge', 'information', 'recommendation', 'reservation', 'booking', 'ticket']
  },
  'wellness-fitness': {
    name: 'Wellness & Fitness',
    description: 'Gym access, fitness classes, pool information, wellness facilities',
    keywords: ['gym', 'fitness', 'exercise', 'pool', 'wellness', 'sauna', 'yoga']
  },
  'security': {
    name: 'Security & Lost Items',
    description: 'Safety concerns, lost and found, room safe assistance',
    keywords: ['security', 'safe', 'lost', 'found', 'key', 'card', 'lock']
  },
  'special-occasions': {
    name: 'Special Occasions',
    description: 'Birthday/Anniversary arrangements, special event planning',
    keywords: ['birthday', 'anniversary', 'celebration', 'special', 'occasion', 'event']
  },
  'other': {
    name: 'Other Services',
    description: 'Any services not covered by other categories, such as currency exchange or bus tickets',
    keywords: ['currency', 'exchange', 'money', 'bus', 'ticket', 'miscellaneous', 'other']
  }
};

/**
 * Structure for service request extracted from conversation
 */
export interface ServiceRequest {
  serviceType: string; // Key from SERVICE_CATEGORIES
  requestText: string; // Full text of request
  details: {
    date?: string;
    time?: string;
    location?: string;
    people?: number;
    amount?: string;
    roomNumber?: string;
    otherDetails?: string;
  }
}

/**
 * Generate a comprehensive summary from transcripts without using AI
 * This is a fallback function when OpenAI is not available
 */
export function generateBasicSummary(transcripts: Array<{role: string, content: string}>): string {
  if (!transcripts || transcripts.length === 0) {
    return "No conversation to summarize.";
  }
  
  // Split into guest and assistant messages for easier analysis
  const guestMessages = transcripts.filter(t => t.role === 'user');
  const assistantMessages = transcripts.filter(t => t.role === 'assistant');
  
  // Extract key information that might be helpful for the form
  const roomNumberMatches = [...guestMessages, ...assistantMessages].map(m => 
    m.content.match(/(?:room\s*(?:number)?|phòng\s*(?:số)?)(?:\s*[:#\-]?\s*)([0-9]{1,4}[A-Za-z]?)|(?:staying in|in room|in phòng|phòng số)(?:\s+)([0-9]{1,4}[A-Za-z]?)/i)
  ).filter(Boolean);
  
  let roomNumber = "Not specified";
  if (roomNumberMatches.length > 0) {
    const match = roomNumberMatches[0];
    if (match) {
      roomNumber = match[1] || match[2] || "Not specified";
    }
  }
  
  // Try to identify the service type from the conversation
  const foodServiceMatches = [...guestMessages, ...assistantMessages].some(m => 
    /food|meal|breakfast|lunch|dinner|sandwich|burger|drink|coffee|tea|juice|water|soda|beer|wine/i.test(m.content)
  );
  
  const housekeepingMatches = [...guestMessages, ...assistantMessages].some(m => 
    /housekeeping|cleaning|towel|clean|bed|sheets|laundry/i.test(m.content)
  );
  
  const transportMatches = [...guestMessages, ...assistantMessages].some(m => 
    /taxi|car|shuttle|transport|pickup|airport/i.test(m.content)
  );
  
  const spaMatches = [...guestMessages, ...assistantMessages].some(m => 
    /spa|massage|wellness|treatment|relax/i.test(m.content)
  );
  
  // Collect all possible service types that appear in the conversation
  const serviceTypes: string[] = [];
  if (foodServiceMatches) serviceTypes.push("Food & Beverage");
  if (housekeepingMatches) serviceTypes.push("Housekeeping");
  if (transportMatches) serviceTypes.push("Transportation");
  if (spaMatches) serviceTypes.push("Spa Service");
  
  // Check for additional service types
  const tourMatches = [...guestMessages, ...assistantMessages].some(m => 
    /tour|sightseeing|excursion|attraction|visit|activity/i.test(m.content)
  );
  if (tourMatches) serviceTypes.push("Tours & Activities");
  
  const technicalMatches = [...guestMessages, ...assistantMessages].some(m => 
    /wifi|internet|tv|television|remote|device|technical|connection/i.test(m.content)
  );
  if (technicalMatches) serviceTypes.push("Technical Support");
  
  const conciergeMatches = [...guestMessages, ...assistantMessages].some(m => 
    /reservation|booking|restaurant|ticket|arrangement|concierge/i.test(m.content)
  );
  if (conciergeMatches) serviceTypes.push("Concierge Services");
  
  const wellnessMatches = [...guestMessages, ...assistantMessages].some(m => 
    /gym|fitness|exercise|yoga|swimming|pool|sauna/i.test(m.content)
  );
  if (wellnessMatches) serviceTypes.push("Wellness & Fitness");
  
  const securityMatches = [...guestMessages, ...assistantMessages].some(m => 
    /safe|security|lost|found|key|card|lock|emergency/i.test(m.content)
  );
  if (securityMatches) serviceTypes.push("Security & Lost Items");
  
  const specialOccasionMatches = [...guestMessages, ...assistantMessages].some(m => 
    /birthday|anniversary|celebration|honeymoon|proposal|wedding|special occasion/i.test(m.content)
  );
  if (specialOccasionMatches) serviceTypes.push("Special Occasions");
  
  // If no services detected, use default
  const serviceType = serviceTypes.length > 0 ? serviceTypes.join(", ") : "Room Service";
  
  // Look for timing information
  const urgentMatches = [...guestMessages, ...assistantMessages].some(m => 
    /urgent|immediately|right away|asap|as soon as possible/i.test(m.content)
  );
  
  const timing = urgentMatches ? "as soon as possible" : "within 30 minutes";
  
  // Get the first and last messages
  const firstUserMessage = guestMessages[0]?.content || "";
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]?.content || "";
  
  // Create a structured summary that can easily be parsed by the form extractor - only in user language
  let summary = `Guest Service Request Summary:\n\n`;
  summary += `Room Number: ${roomNumber}\n`;
  
  // Just use the service types directly, no translations
  summary += `Service Type(s): ${serviceType}\n`;
  
  // Timing information
  summary += `Service Timing Requested: ${timing}\n\n`;
  
  // Create a detailed list of requests based on detected service types
  summary += "List of Requests:\n";
  
  let requestCounter = 1;
  
  if (foodServiceMatches) {
    summary += `Request ${requestCounter}: Food & Beverage\n`;
    // Try to extract food items
    const foodItems = [...guestMessages].flatMap(m => {
      const matches = m.content.match(/(?:want|like|order|bring|get|have)(?:\s+(?:a|an|some|the))?\s+([a-zA-Z\s]+)(?:\.|,|$)/gi);
      return matches ? matches.map(match => match.replace(/(?:want|like|order|bring|get|have)(?:\s+(?:a|an|some|the))?\s+/i, '').trim()) : [];
    });
    
    if (foodItems.length > 0) {
      summary += `- Items: ${foodItems.join(', ')}\n`;
      summary += `- Service Description: Guest requested food and beverage service\n`;
      // Try to extract details about timing
      const timeReferences = [...guestMessages].some(m => 
        m.content.toLowerCase().includes('urgent') || 
        m.content.toLowerCase().includes('right now') ||
        m.content.toLowerCase().includes('immediately')
      );
      summary += `- Service Timing Requested: ${timeReferences ? 'As soon as possible' : 'Within 30 minutes'}\n`;
    } else {
      summary += "- Items: Food items discussed during call\n";
      summary += "- Service Description: Room service order requested\n";
      summary += "- Service Timing Requested: Standard delivery time\n";
    }
    requestCounter++;
  }
  
  if (transportMatches) {
    summary += `Request ${requestCounter}: Transportation\n`;
    summary += "- Details: Requested transportation service\n";
    summary += "- Service Description: Guest needs transport arrangements\n";
    
    // Extract possible destinations
    const destinations = [...guestMessages].flatMap(m => {
      const destinationMatch = m.content.match(/(?:to|from|for|at)\s+([a-zA-Z\s]+)(?:\.|,|$)/gi);
      return destinationMatch ? destinationMatch.map(match => match.trim()) : [];
    });
    
    if (destinations.length > 0) {
      summary += `- Destinations: ${destinations.join(', ')}\n`;
    }
    
    summary += "- Service Timing Requested: As specified by guest\n";
    requestCounter++;
  }
  
  if (housekeepingMatches) {
    summary += `Request ${requestCounter}: Housekeeping\n`;
    summary += "- Details: Requested room cleaning or maintenance\n";
    summary += "- Service Description: Room cleaning or maintenance needed\n";
    summary += "- Service Timing Requested: As per guest's preference\n";
    requestCounter++;
  }
  
  if (spaMatches) {
    summary += `Request ${requestCounter}: Spa Service\n`;
    summary += "- Details: Requested spa services\n";
    summary += "- Service Description: Spa appointment or treatment information\n";
    summary += "- Service Timing Requested: According to spa availability\n";
    requestCounter++;
  }
  
  if (tourMatches) {
    summary += `Request ${requestCounter}: Tours & Activities\n`;
    summary += "- Details: Requested tour or activity arrangement\n";
    summary += "- Service Description: Guest interested in local tours or activities\n";
    summary += "- Service Timing Requested: Based on tour schedule availability\n";
    requestCounter++;
  }
  
  if (technicalMatches) {
    summary += `Request ${requestCounter}: Technical Support\n`;
    summary += "- Details: Requested technical assistance\n";
    summary += "- Service Description: Technical issue requires attention\n";
    summary += "- Service Timing Requested: As soon as possible\n";
    requestCounter++;
  }
  
  if (conciergeMatches) {
    summary += `Request ${requestCounter}: Concierge Services\n`;
    summary += "- Details: Requested booking or reservation assistance\n";
    summary += "- Service Description: Booking assistance or information needed\n";
    summary += "- Service Timing Requested: Based on reservation requirements\n";
    requestCounter++;
  }
  
  if (wellnessMatches) {
    summary += `Request ${requestCounter}: Wellness & Fitness\n`;
    summary += "- Details: Requested wellness or fitness facilities\n";
    summary += "- Service Description: Access to or information about fitness services\n";
    summary += "- Service Timing Requested: According to facility hours\n";
    requestCounter++;
  }
  
  if (securityMatches) {
    summary += `Request ${requestCounter}: Security & Lost Items\n`;
    summary += "- Details: Requested security assistance or reported lost item\n";
    summary += "- Service Description: Security concern or lost item assistance needed\n";
    summary += "- Service Timing Requested: Urgent attention required\n";
    requestCounter++;
  }
  
  if (specialOccasionMatches) {
    summary += `Request ${requestCounter}: Special Occasions\n`;
    summary += "- Details: Requested special occasion arrangement\n";
    summary += "- Service Description: Support needed for celebration or special event\n";
    summary += "- Service Timing Requested: According to event timing\n";
    requestCounter++;
  }
  
  summary += `\nSpecial Instructions: Any special requirements mentioned during the call.\n\n`;
  
  if (firstUserMessage) {
    summary += `The conversation began with the guest saying: "${firstUserMessage.substring(0, 50)}${firstUserMessage.length > 50 ? '...' : ''}". `;
  }
  
  if (lastAssistantMessage) {
    summary += `The conversation concluded with the assistant saying: "${lastAssistantMessage.substring(0, 50)}${lastAssistantMessage.length > 50 ? '...' : ''}".`;
  }
  
  return summary;
}

/**
 * Use OpenAI to extract service requests with detailed categorization and information
 * @param summary The summary to analyze
 * @returns Array of service requests with detailed information
 */
export async function extractServiceRequests(summary: string): Promise<ServiceRequest[]> {
  try {
    if (!summary) {
      return [];
    }
    
    // Create a prompt for analyzing the summary and extracting structured data
    const prompt = `
      You are a detailed hotel service analyzer for Mi Nhon Hotel in Mui Ne, Vietnam.
      
      Please analyze the following service summary and extract the MOST COMPREHENSIVE AND DETAILED information about each request. This information will be used by hotel staff to fulfill requests precisely.
      
      For each distinct service request:
      1. Identify the most appropriate service category from this list: room-service, food-beverage, housekeeping, transportation, spa, tours-activities, technical-support, concierge, wellness-fitness, security, special-occasions, other
      2. Extract ALL specific details mentioned - NEVER leave fields empty if you can infer information
      3. For dates, use YYYY-MM-DD format and always try to infer the date even if not explicitly stated (use current year if year is missing)
      4. For times, use 24-hour format and provide detailed time ranges when mentioned
      5. For room numbers, always include this information if available, as it's critical for service delivery
      6. For "otherDetails", include ALL additional information that would help staff fulfill the request properly
      7. Provide a clean, detailed request text that captures the full context of the request
      
      IMPORTANT: ALL fields should be as detailed and specific as possible. NEVER leave fields as null if there is ANY possibility to infer information from context.
      
      Return the data in valid JSON format like this:
      {
        "requests": [
          {
            "serviceType": "tours-activities",
            "requestText": "Book a half-day city tour with an English-speaking guide for tomorrow morning",
            "details": {
              "date": "2023-05-15",
              "time": "09:00-12:00",
              "people": 2,
              "location": "City Center historical sites and local market",
              "amount": "300000 VND per person",
              "roomNumber": "301",
              "otherDetails": "English-speaking guide requested, guests prefer walking tour with minimal transportation, interested in local cuisine and history"
            }
          },
          ...
        ]
      }
      
      Summary to analyze:
      ${summary}
    `;
    
    try {
      const options = { timeout: 20000, headers: { 'OpenAi-Project': projectId } };
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a precise hotel service data extraction specialist that outputs structured JSON only." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 1500
      }, options);
      
      // Parse the JSON response
      const responseContent = response.choices[0].message.content;
      if (!responseContent) {
        console.log("Empty response from OpenAI");
        return [];
      }
      
      try {
        const parsedResponse = JSON.parse(responseContent);
        
        // Check if the parsed response is already an array
        if (Array.isArray(parsedResponse)) {
          return parsedResponse;
        }
        
        // Check if it has a 'requests' property that is an array
        if (parsedResponse.requests && Array.isArray(parsedResponse.requests)) {
          return parsedResponse.requests;
        }
        
        // Log the actual response structure for debugging
        console.log("Unexpected response structure:", JSON.stringify(parsedResponse, null, 2));
        
        // Attempt to convert a non-array response to an array if it has the right format
        if (parsedResponse.serviceType && parsedResponse.requestText) {
          return [parsedResponse];
        }
        
        return [];
      } catch (parseError) {
        console.error("Error parsing OpenAI JSON response:", parseError);
        console.error("Raw response:", responseContent);
        return [];
      }
    } catch (apiError) {
      console.error("Error calling OpenAI API for service extraction:", apiError);
      return [];
    }
  } catch (error) {
    console.error("Unexpected error in extractServiceRequests:", error);
    return [];
  }
}

/**
 * Generate a summary from the provided transcript 
 * @param transcripts Array of conversation parts
 * @returns The AI-generated summary
 */
/**
 * Translate text to Vietnamese
 * @param text Text to translate
 * @returns Vietnamese translation
 */
export async function translateToVietnamese(text: string): Promise<string> {
  try {
    if (!text) {
      return "Không có nội dung để dịch.";
    }

    const prompt = `
      Bạn là một chuyên gia dịch thuật chuyên nghiệp. Hãy dịch đoạn văn sau đây từ tiếng Anh sang tiếng Việt.
      Giữ nguyên các số phòng, tên riêng, và định dạng gạch đầu dòng.
      Hãy dịch một cách tự nhiên và đầy đủ nhất có thể.
      
      Văn bản cần dịch:
      ${text}
      
      Bản dịch tiếng Việt:
    `;

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Bạn là một chuyên gia dịch thuật chuyên nghiệp cho khách sạn, dịch từ tiếng Anh sang tiếng Việt." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }, { headers: { 'OpenAi-Project': projectId } });

    return chatCompletion.choices[0].message.content?.trim() || "Không thể dịch văn bản.";
  } catch (error: any) {
    console.error("Error translating to Vietnamese with OpenAI:", error);
    return "Không thể dịch văn bản. Vui lòng thử lại sau.";
  }
}

export async function generateCallSummary(transcripts: Array<{role: string, content: string}>): Promise<string> {
  try {
    if (!transcripts || transcripts.length === 0) {
      return "No conversation to summarize.";
    }

    // Format conversation for the prompt
    const conversationText = transcripts
      .map(t => `${t.role === 'assistant' ? 'Hotel Assistant' : 'Guest'}: ${t.content}`)
      .join('\n');

    // Create a prompt for generating the summary in user's language only
    const prompt = `
      You are a hotel service summarization specialist for Mi Nhon Hotel. 
      Summarize the following conversation between a Hotel Assistant and a Guest in a very concise and professional manner.
      
      IMPORTANT: For EACH separate request from the guest, structure your summary in the following format:
      
      Request 1:
      - Type of service: [service category name]
      - Request details: [comprehensive details of the request]
      
      Request 2:
      - Type of service: [service category name]
      - Request details: [comprehensive details of the request]
      
      For example:
      
      Request 1:
      - Type of service: Room Service
      - Request details: Guest requested breakfast delivery with 2 eggs, toast, coffee to room 301 at 7:30 AM tomorrow. Guest specified hot coffee with milk on the side.
      
      Request 2:
      - Type of service: Transportation
      - Request details: Guest needs taxi to airport tomorrow at 10:00 AM for 3 people with 4 large suitcases. Requested an SUV or larger vehicle.
      
      IMPORTANT INSTRUCTIONS:
      1. Provide the summary only in the guest's original language (English, Russian, Korean, Chinese, or German)
      2. Be EXTREMELY comprehensive - include EVERY service request mentioned in the conversation
      3. Format with bullet points for easy scanning by hotel staff
      4. ALWAYS ASK FOR AND INCLUDE ROOM NUMBER - This is the most critical information for every request
      5. If room number is not mentioned in the conversation, make a clear note that "Room number needs to be confirmed with guest"
      6. For ALL service details, include times, locations, quantities, and any specific requirements
      7. End with any required follow-up actions or confirmation needed from staff

      Conversation transcript:
      ${conversationText}

      Summary:
    `;

    // Call the OpenAI API with GPT-4o
    const options = {
      timeout: 30000, // 30 second timeout to prevent hanging
      headers: { 'OpenAi-Project': projectId }
    };
    
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are a professional hotel service summarization specialist who creates concise and useful summaries." },
        { role: "user", content: prompt }
      ],
      max_tokens: 800, // Increased tokens limit for comprehensive summaries
      temperature: 0.5, // More deterministic for consistent summaries
      presence_penalty: 0.1, // Slight penalty to avoid repetition
      frequency_penalty: 0.1, // Slight penalty to avoid repetition
    }, options);

    // Return the generated summary
    return chatCompletion.choices[0].message.content?.trim() || "Failed to generate summary.";
  } catch (error: any) {
    console.error("Error generating summary with OpenAI:", error);
    
    // Check for specific error types and provide more helpful messages
    if (error?.code === 'invalid_api_key') {
      return "Could not generate AI summary: API key authentication failed. Please contact hotel staff to resolve this issue.";
    } else if (error?.status === 429 || error?.code === 'insufficient_quota') {
      // For rate limit errors, return just the detailed error
      console.log('Rate limit or quota exceeded, falling back to basic summary generator');
      return generateBasicSummary(transcripts);
    } else if (error?.status === 500) {
      return "Could not generate AI summary: OpenAI service is currently experiencing issues. Please try again later.";
    }
    
    // If OpenAI is unavailable for any other reason, use the basic summary as fallback
    const basicSummary = generateBasicSummary(transcripts);
    return basicSummary;
  }
}