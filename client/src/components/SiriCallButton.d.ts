import { FC } from 'react';

export interface SiriCallButtonProps {
  containerId: string;
  isListening: boolean;
  volumeLevel: number;
}

declare const SiriCallButton: FC<SiriCallButtonProps>;
export default SiriCallButton; 