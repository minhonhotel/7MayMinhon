import { ReferenceItem } from '@/services/ReferenceService';
import { FC } from 'react';

export interface ReferenceProps {
  references: ReferenceItem[];
}

declare const Reference: FC<ReferenceProps>;
export default Reference; 