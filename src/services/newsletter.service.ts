import { getDb } from '../config/db';
import { NewsletterSubscriberDocument } from '../types/newsletter';
import { MongoServerError } from 'mongodb';

export class NewsletterService {
  public static async subscribe(email: string): Promise<void> {
    const db = getDb();
    const subscribersCollection = db.collection<NewsletterSubscriberDocument>('newslettersubscribers');

    try {
      await subscribersCollection.insertOne({
        email,
        subscribedAt: new Date(),
      } as NewsletterSubscriberDocument);
    } catch (error: any) {
      if (error instanceof MongoServerError && error.code === 11000) {
        // Already subscribed, we can just throw a handled error or ignore
        throw new Error('Email is already subscribed');
      }
      throw error;
    }
  }
}
