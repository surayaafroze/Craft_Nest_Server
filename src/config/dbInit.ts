import { Db } from 'mongodb';

export const initDbCollectionsAndIndexes = async (db: Db): Promise<void> => {
  try {
    console.log('Initializing database collections and indexes...');

    // 1. users indexes
    const users = db.collection('users');
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ googleId: 1 }, { unique: true, sparse: true });

    // 2. items indexes
    const items = db.collection('items');
    await items.createIndex({ ownerId: 1 });
    await items.createIndex({ category: 1 });
    await items.createIndex({ price: 1 });
    await items.createIndex({ status: 1 });
    await items.createIndex(
      { title: 'text', shortDescription: 'text' },
      { name: 'items_text_index' }
    );

    // 3. reviews indexes
    const reviews = db.collection('reviews');
    await reviews.createIndex({ itemId: 1 });
    await reviews.createIndex({ userId: 1, itemId: 1 }, { unique: true });

    // 4. wishlists indexes
    const wishlists = db.collection('wishlists');
    await wishlists.createIndex({ userId: 1 }, { unique: true });

    // 5. blogposts indexes
    const blogposts = db.collection('blogposts');
    await blogposts.createIndex({ slug: 1 }, { unique: true });

    // 6. newslettersubscribers indexes
    const subscribers = db.collection('newslettersubscribers');
    await subscribers.createIndex({ email: 1 }, { unique: true });

    // 7. contactmessages indexes
    const contactMessages = db.collection('contactmessages');
    await contactMessages.createIndex({ createdAt: 1 });

    console.log('Successfully initialized database collections and indexes!');
  } catch (error) {
    console.error('Failed to initialize database collections and indexes:', error);
    throw error;
  }
};
