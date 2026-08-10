export interface ContactMessageDocument {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  createdAt: Date;
}
