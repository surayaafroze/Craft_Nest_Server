import { ObjectId } from 'mongodb';

export interface WishlistDocument {
  _id: ObjectId;
  userId: ObjectId;               // references users._id, unique
  itemIds: ObjectId[];            // array of referenced items._id
  updatedAt: Date;
}
