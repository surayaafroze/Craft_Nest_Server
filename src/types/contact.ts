import { ObjectId } from 'mongodb';

export interface ContactMessageDocument {
  _id: ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  createdAt: Date;
}
