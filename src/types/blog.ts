import { ObjectId } from 'mongodb';

export interface BlogPostDocument {
  _id: ObjectId;
  title: string;
  slug: string;                    // unique index
  coverImage: string;
  content: string;
  tags: string[];
  publishedAt: Date;
}
