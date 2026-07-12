import { getDb } from '../config/db';
import { BlogPostDocument } from '../types/blog';
import { MongoServerError } from 'mongodb';

export class BlogService {
  public static async createBlog(data: { title: string; slug: string; coverImage: string; content: string; tags: string[] }): Promise<BlogPostDocument> {
    const db = getDb();
    const blogpostsCollection = db.collection<BlogPostDocument>('blogposts');

    const newPost: Omit<BlogPostDocument, '_id'> = {
      ...data,
      publishedAt: new Date(),
    };

    try {
      const result = await blogpostsCollection.insertOne(newPost as BlogPostDocument);
      return { ...newPost, _id: result.insertedId } as BlogPostDocument;
    } catch (error: any) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new Error('Slug must be unique');
      }
      throw error;
    }
  }

  public static async updateBlog(slug: string, data: Partial<Omit<BlogPostDocument, '_id' | 'publishedAt'>>): Promise<BlogPostDocument | null> {
    const db = getDb();
    const blogpostsCollection = db.collection<BlogPostDocument>('blogposts');

    try {
      const result = await blogpostsCollection.findOneAndUpdate(
        { slug },
        { $set: data },
        { returnDocument: 'after' }
      );
      
      if (!result) {
        return null; // Will just return null if not found
      }
      return result;
    } catch (error: any) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new Error('Slug must be unique');
      }
      throw error;
    }
  }

  public static async deleteBlog(slug: string): Promise<boolean> {
    const db = getDb();
    const blogpostsCollection = db.collection<BlogPostDocument>('blogposts');

    const result = await blogpostsCollection.deleteOne({ slug });
    return result.deletedCount === 1;
  }

  public static async getBlogList(): Promise<BlogPostDocument[]> {
    const db = getDb();
    const blogpostsCollection = db.collection<BlogPostDocument>('blogposts');

    // Return all sorted by newest first
    return blogpostsCollection.find().sort({ publishedAt: -1 }).toArray();
  }

  public static async getBlogBySlug(slug: string): Promise<BlogPostDocument | null> {
    const db = getDb();
    const blogpostsCollection = db.collection<BlogPostDocument>('blogposts');

    return blogpostsCollection.findOne({ slug });
  }
}
