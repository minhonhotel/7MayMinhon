import React, { useState, useEffect } from 'react';
import { ReferenceItem } from '@/services/ReferenceService';

interface ReferenceProps {
  references: ReferenceItem[];
}

const Reference: React.FC<ReferenceProps> = ({ references }) => {
  // State to hold fetched text content for .txt documents
  const [docContents, setDocContents] = useState<Record<string, string>>({});

  // Fetch text for any .txt documents to preview inline
  useEffect(() => {
    references.forEach(ref => {
      if (ref.type === 'document' && ref.url.endsWith('.txt') && !docContents[ref.url]) {
        fetch(ref.url)
          .then(res => res.text())
          .then(text => setDocContents(prev => ({ ...prev, [ref.url]: text })))
          .catch(err => console.error('Error fetching document text:', err));
      }
    });
  }, [references, docContents]);

  // Helper to normalize asset URLs
  const getAssetUrl = (url: string) => {
    // External links unchanged
    if (/^https?:\/\//.test(url)) return url;
    // Ensure URL does not start with slash
    const path = url.replace(/^\//, '');
    return `${import.meta.env.BASE_URL}${path}`;
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(getAssetUrl(url));
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleOpenLink = (url: string) => {
    window.open(getAssetUrl(url), '_blank');
  };

  const renderReference = (reference: ReferenceItem) => {
    switch (reference.type) {
      case 'image':
        return (
          <div className="relative group">
            <img
              src={getAssetUrl(reference.url)}
              alt={reference.title}
              className="w-full h-48 object-cover rounded-lg cursor-pointer"
              onClick={() => handleOpenLink(reference.url)}
            />
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-sm font-medium">{reference.title}</p>
              {reference.description && (
                <p className="text-xs">{reference.description}</p>
              )}
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="material-icons text-gray-500 mr-3">description</span>
                <div>
                  <p className="font-medium">{reference.title}</p>
                  {reference.description && (
                    <p className="text-sm text-gray-500">{reference.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDownload(reference.url, reference.title)}
                className="p-2 text-primary hover:bg-primary hover:text-white rounded-full transition-colors"
              >
                <span className="material-icons">download</span>
              </button>
            </div>
            {/* Inline preview for text and PDF documents */}
            {reference.url.endsWith('.txt') && docContents[reference.url] && (
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-sm text-gray-700">
                {docContents[reference.url]}
              </pre>
            )}
            {reference.url.endsWith('.pdf') && (
              <embed
                src={getAssetUrl(reference.url)}
                type="application/pdf"
                className="w-full h-64 mt-2 rounded"
              />
            )}
          </div>
        );

      case 'link':
        return (
          <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="material-icons text-gray-500 mr-3">link</span>
            <div className="flex-grow">
              <p className="font-medium">{reference.title}</p>
              {reference.description && (
                <p className="text-sm text-gray-500">{reference.description}</p>
              )}
            </div>
            <button
              onClick={() => handleOpenLink(reference.url)}
              className="ml-3 p-2 text-primary hover:bg-primary hover:text-white rounded-full transition-colors"
            >
              <span className="material-icons">open_in_new</span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="w-4/5 mx-auto rounded-lg border border-gray-200 p-5">
      <h3 className="font-semibold text-xl text-white mb-4">References</h3>
      <div className="grid grid-cols-3 gap-4">
        {references.map((reference, index) => (
          <div key={`${reference.url}-${index}`} className="border rounded-lg p-2">
            {renderReference(reference)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reference; 