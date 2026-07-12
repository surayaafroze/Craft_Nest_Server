import { ObjectId } from 'mongodb';

export interface ItemDocument {
  _id: ObjectId;
  ownerId: ObjectId;
  title: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  category: string;
  images: string[];
  quantity: number;
  location: string;
  avgRating: number;
  reviewCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
