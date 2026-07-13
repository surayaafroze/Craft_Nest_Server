import { ObjectId } from 'mongodb';
import { getDb } from '../config/db';
import { UserDocument } from '../types/user';

export class UserService {
  public static async getUserById(userId: string) {
    const db = getDb();
    const usersCollection = db.collection<UserDocument>('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { passwordHash: 0 } }
    );

    return user;
  }

  public static async updateUser(userId: string, updateData: Partial<UserDocument>) {
    const db = getDb();
    const usersCollection = db.collection<UserDocument>('users');

    // Filter out restricted fields to ensure they cannot be updated
    const { _id, email, passwordHash, role, authProvider, googleId, status, createdAt, ...allowedUpdates } = updateData as any;

    if (Object.keys(allowedUpdates).length === 0) {
      return null;
    }

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          ...allowedUpdates,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after', projection: { passwordHash: 0 } }
    );

    return result;
  }
}
