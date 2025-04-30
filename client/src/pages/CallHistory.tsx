import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { CallSummary } from '@/types';

const CallHistory: React.FC = () => {
  const [timeframe, setTimeframe] = useState<number>(24);
  const [roomFilter, setRoomFilter] = useState<string>('');
  
  // Query to fetch call summaries from the last 24 hours
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['summaries', 'recent', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/summaries/recent/${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent call summaries');
      }
      return response.json();
    },
  });
  
  // Format date for display
  const formatDate = (dateObj: Date | string) => {
    const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format call duration for display (accepts "mm:ss" or numeric seconds)
  const formatDuration = (duration: string | undefined) => {
    if (!duration) return '00:00';
    // If duration is pure seconds number, format to mm:ss
    const seconds = parseInt(duration, 10);
    if (!isNaN(seconds) && /^\d+$/.test(duration)) {
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
    }
    // If already mm:ss or other format, return as-is
    return duration;
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (hours: number) => {
    setTimeframe(hours);
  };
  
  // Filter summaries by room number if filter is set
  const filteredSummaries = data?.summaries.filter((summary: CallSummary) => {
    if (!roomFilter) return true;
    return summary.roomNumber && summary.roomNumber.toLowerCase().includes(roomFilter.toLowerCase());
  });
  
  return (
    <div className="container mx-auto p-5">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-primary">Call History</h1>
          <div className="flex space-x-3">
            <Link to="/">
              <button className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors flex items-center">
                <span className="material-icons align-middle mr-1 text-sm">home</span>
                Home
              </button>
            </Link>
            <button 
              onClick={() => refetch()} 
              className="px-4 py-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center"
            >
              <span className="material-icons align-middle mr-1 text-sm">refresh</span>
              Refresh
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Time Period</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleTimeframeChange(24)} 
                  className={`px-3 py-1 rounded-md ${timeframe === 24 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  24 hours
                </button>
                <button 
                  onClick={() => handleTimeframeChange(48)} 
                  className={`px-3 py-1 rounded-md ${timeframe === 48 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  48 hours
                </button>
                <button 
                  onClick={() => handleTimeframeChange(72)} 
                  className={`px-3 py-1 rounded-md ${timeframe === 72 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  72 hours
                </button>
              </div>
            </div>
            
            <div className="space-y-2 md:w-1/3">
              <h3 className="font-medium text-gray-700">Filter by Room</h3>
              <input
                type="text"
                placeholder="Enter room number..."
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </header>
      
      <main>
        {isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-sm flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500">Loading call history...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="bg-red-50 p-6 rounded-lg shadow-sm flex justify-center items-center h-64">
            <div className="flex flex-col items-center text-center">
              <span className="material-icons text-red-500 text-4xl mb-3">error_outline</span>
              <p className="text-red-700 mb-2">Unable to load call history</p>
              <p className="text-red-500 text-sm">Please try again later or contact administrator.</p>
              <button 
                onClick={() => refetch()} 
                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredSummaries?.length ? (
          <div className="bg-white p-4 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left text-sm font-medium text-gray-500">Time</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-500">Room</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-500">Duration</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-500">Summary</th>
                    <th className="p-3 text-center text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummaries.map((summary: CallSummary) => (
                    <tr key={summary.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-700">{formatDate(summary.timestamp)}</td>
                      <td className="p-3 text-sm text-gray-700">{summary.roomNumber || 'Unknown'}</td>
                      <td className="p-3 text-sm text-gray-700">{formatDuration(summary.duration)}</td>
                      <td className="p-3 text-sm text-gray-700 max-w-md">
                        <div className="truncate">{summary.content}</div>
                      </td>
                      <td className="p-3 text-center">
                        <Link to={`/call-details/${summary.callId}`}>
                          <button className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-xs">
                            <span className="material-icons text-sm mr-1">visibility</span>
                            View Details
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm flex justify-center items-center h-64">
            <div className="flex flex-col items-center text-center">
              <span className="material-icons text-gray-400 text-4xl mb-3">history</span>
              <p className="text-gray-500 mb-2">No calls found</p>
              <p className="text-gray-400 text-sm">
                {roomFilter 
                  ? `No calls from room "${roomFilter}" in the last ${timeframe} hours.` 
                  : `No calls found in the last ${timeframe} hours.`}
              </p>
            </div>
          </div>
        )}
      </main>
      
      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>Showing call history from the last {timeframe} hours • Total: {data?.count || 0} calls</p>
      </div>
    </div>
  );
};

export default CallHistory;