import { Schema, model } from 'mongoose';

interface IReference {
  type: 'image' | 'link' | 'document';
  url: string;
  title: string;
  description?: string;
  callId: string;
  createdAt: Date;
}

const referenceSchema = new Schema<IReference>({
  type: {
    type: String,
    enum: ['image', 'link', 'document'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  callId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Reference = model<IReference>('Reference', referenceSchema);
export type { IReference }; 