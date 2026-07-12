import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export const connectDb = async (): Promise<Db> => {
  if (db) return db;

  const uri = process.env.MONGO_DB_URI;
  if (!uri) {
    throw new Error('MONGO_DB_URI is not defined in the environment variables.');
  }

  const dbName = process.env.MONGO_DB_NAME || 'Craft_Nest';

  client = new MongoClient(uri);

  try {
    await client.connect();
    // Send a ping to confirm connection
    await client.db('admin').command({ ping: 1 });
    console.log('Successfully connected and pinged MongoDB deployment!');
    
    db = client.db(dbName);
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    if (client) {
      await client.close();
    }
    throw error;
  }
};

export const getDb = (): Db => {
  if (!db) {
    throw new Error('Database is not initialized. Please call connectDb() first.');
  }
  return db;
};

export const closeDb = async (): Promise<void> => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed.');
    client = null;
    db = null;
  }
};
