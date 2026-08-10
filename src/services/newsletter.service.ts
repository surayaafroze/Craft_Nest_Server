import { prisma } from '../config/db';

export class NewsletterService {
  public static async subscribe(email: string): Promise<void> {
    try {
      await prisma.newsletterSubscriber.create({
        data: {
          email,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Email is already subscribed');
      }
      throw error;
    }
  }
}
