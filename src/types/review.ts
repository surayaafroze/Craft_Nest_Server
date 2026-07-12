import { ObjectId } from 'mongodb';

export interface ReviewDocument {
  _id: ObjectId;
  itemId: ObjectId;               // references items._id
  userId: ObjectId;               // references users._id
  rating: number;                 // 1-5
  comment: string;
  createdAt: Date;
}
