import React from 'react';
import { useTranscriptSocket } from '../hooks/useTranscriptSocket';
import styles from './TranscriptDisplay.module.css';

interface TranscriptDisplayProps {
  socketUrl: string;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ socketUrl }) => {
  const { transcript, isAssistantSpeaking } = useTranscriptSocket({ socketUrl });

  return (
    <div className={styles.transcriptContainer}>
      <div className={styles.transcriptStatus}>
        {isAssistantSpeaking ? 'Assistant is speaking...' : 'User is speaking...'}
      </div>
      <div className={styles.transcriptText}>
        {transcript}
      </div>
    </div>
  );
};

export default TranscriptDisplay; 