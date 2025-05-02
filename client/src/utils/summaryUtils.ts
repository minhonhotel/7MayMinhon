import { CallSummary, OrderSummary } from '../types';
import { ExtractedRequest, extractRequests, normalizeRequestType } from './requestExtractor';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export interface SummaryStats {
  totalRequests: number;
  byType: {
    type: string;
    count: number;
    hasUrgentRequests: boolean;
  }[];
}

export interface AnalyzedSummary {
  requests: ExtractedRequest[];
  groupedByType: Record<string, ExtractedRequest[]>;
  stats: SummaryStats;
}

export const validateSummaryContent = (content: string): boolean => {
  // Check minimum length
  if (content.length < 50) return false;
  
  // Check for required sections
  if (!content.includes('Request') || !content.includes('Type of service')) return false;
  
  // Check for room number
  if (!content.includes('Room') && !content.includes('room number')) return false;
  
  return true;
};

export const generateSummaryWithRetry = async (
  transcripts: any[],
  generateFn: (transcripts: any[]) => Promise<string>,
  retryCount = 0
): Promise<string> => {
  try {
    const summary = await generateFn(transcripts);
    if (!validateSummaryContent(summary)) {
      throw new Error('Generated summary did not meet quality standards');
    }
    return summary;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return generateSummaryWithRetry(transcripts, generateFn, retryCount + 1);
    }
    throw error;
  }
};

export const analyzeServiceRequests = (content: string): AnalyzedSummary => {
  const requests = extractRequests(content);
  
  // Group by service type
  const groupedByType = requests.reduce((acc, req) => {
    const type = normalizeRequestType(req.type);
    if (!acc[type]) acc[type] = [];
    acc[type].push(req);
    return acc;
  }, {} as Record<string, ExtractedRequest[]>);
  
  // Calculate statistics
  const stats = {
    totalRequests: requests.length,
    byType: Object.entries(groupedByType).map(([type, reqs]) => ({
      type,
      count: reqs.length,
      hasUrgentRequests: reqs.some(r => 
        r.details.time?.toLowerCase().includes('urgent') ||
        r.details.time?.toLowerCase().includes('immediate')
      )
    }))
  };
  
  return { requests, groupedByType, stats };
};

export const handleSummaryError = (
  error: Error,
  callId: string | undefined,
  setCallSummary: (summary: CallSummary) => void
): void => {
  console.error('Summary generation error:', error);
  
  let errorMessage = 'An error occurred while generating the summary.';
  
  if (error.message.includes('API')) {
    errorMessage = 'Could not connect to AI service. Please try again.';
  } else if (error.message.includes('timeout')) {
    errorMessage = 'Request timed out. Please try again.';
  } else if (error.message.includes('validation')) {
    errorMessage = 'Generated summary did not meet quality standards.';
  }
  
  setCallSummary({
    id: Date.now() as unknown as number,
    callId: callId || `call-${Date.now()}`,
    content: errorMessage,
    timestamp: new Date(),
    isError: true
  });
};

export const exportSummary = (
  callSummary: CallSummary,
  orderSummary: OrderSummary | null,
  groupedRequests: Record<string, string[]>,
  userNotes: string
): void => {
  const summaryText = `
Mi Nhon Hotel - Call Summary
===========================
Call ID: ${callSummary.callId}
Time: ${new Date(callSummary.timestamp).toLocaleString()}
Room: ${orderSummary?.roomNumber || 'Not specified'}

Summary Content:
${callSummary.content}

Service Requests:
${Object.entries(groupedRequests)
  .map(([type, requests]) => 
    `\n${type}:\n${requests.map(r => `- ${r}`).join('\n')}`)
  .join('\n')}

Additional Notes:
${userNotes || 'No additional notes'}
`;

  try {
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-summary-${callSummary.callId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting summary:', error);
  }
}; 