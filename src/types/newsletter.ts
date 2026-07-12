import { ObjectId } from 'mongodb';

export interface NewsletterSubscriberDocument {
  _id: ObjectId;
  email: string;                   // unique index
  subscribedAt: Date;
}
