import { ObjectId } from 'mongodb';

export interface CategoryDocument {
  _id: ObjectId;
  name: string;
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}
