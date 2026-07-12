import { getDb } from '../config/db';
import { ContactMessageDocument } from '../types/contact';
import { ObjectId } from 'mongodb';

export class ContactService {
  public static async submitMessage(data: { name: string; email: string; subject: string; message: string }): Promise<ContactMessageDocument> {
    const db = getDb();
    const contactMessagesCollection = db.collection<ContactMessageDocument>('contactmessages');

    const newMessage: Omit<ContactMessageDocument, '_id'> = {
      ...data,
      status: 'new',
      createdAt: new Date(),
    };

    const result = await contactMessagesCollection.insertOne(newMessage as ContactMessageDocument);
    return { ...newMessage, _id: result.insertedId } as ContactMessageDocument;
  }

  public static async getAllMessages(): Promise<ContactMessageDocument[]> {
    const db = getDb();
    const contactMessagesCollection = db.collection<ContactMessageDocument>('contactmessages');

    return contactMessagesCollection.find().sort({ createdAt: -1 }).toArray();
  }

  public static async updateStatus(id: string, status: 'new' | 'read' | 'responded'): Promise<ContactMessageDocument | null> {
    const db = getDb();
    const contactMessagesCollection = db.collection<ContactMessageDocument>('contactmessages');

    let objId: ObjectId;
    try {
      objId = new ObjectId(id);
    } catch {
      return null;
    }

    return contactMessagesCollection.findOneAndUpdate(
      { _id: objId },
      { $set: { status } },
      { returnDocument: 'after' }
    );
  }

  public static async deleteMessage(id: string): Promise<boolean> {
    const db = getDb();
    const contactMessagesCollection = db.collection<ContactMessageDocument>('contactmessages');

    let objId: ObjectId;
    try {
      objId = new ObjectId(id);
    } catch {
      return false;
    }

    const result = await contactMessagesCollection.deleteOne({ _id: objId });
    return result.deletedCount === 1;
  }
}
