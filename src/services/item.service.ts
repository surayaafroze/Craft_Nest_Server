import { ObjectId } from 'mongodb';
import { getDb } from '../config/db';
import { ItemDocument } from '../types/item';
import { UserDocument } from '../types/user';

export interface GetItemsParams {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
  page: number;
  limit: number;
  skip: number;
  isAdmin?: boolean;
}

export class ItemService {
  static getCollection() {
    return getDb().collection<ItemDocument>('items');
  }

  static async populateOwners(items: ItemDocument[]): Promise<ItemDocument[]> {
    if (!items.length) return items;
    
    const usersCollection = getDb().collection<UserDocument>('users');
    const ownerIds = [...new Set(items.map(item => item.ownerId.toString()))].map(id => new ObjectId(id));
    
    const users = await usersCollection.find({ _id: { $in: ownerIds } }).toArray();
    const userMap = new Map(users.map(u => [u._id.toString(), { name: u.name, avatarUrl: u.avatarUrl }]));
    
    return items.map(item => ({
      ...item,
      owner: userMap.get(item.ownerId.toString())
    }));
  }

  static async getItems(params: GetItemsParams) {
    const { search, category, minPrice, maxPrice, status, sortBy, sortOrder, skip, limit, isAdmin } = params;
    const itemsCollection = this.getCollection();

    const queryObj: any = {};

    // 1. Status Filter
    if (isAdmin && status && typeof status === 'string') {
      queryObj.status = status;
    } else {
      queryObj.status = 'approved';
    }

    // 2. Exact Match Filters
    if (category && typeof category === 'string') {
      queryObj.category = category;
    }

    // 3. Range Filters
    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = Number(minPrice);
      if (maxPrice) queryObj.price.$lte = Number(maxPrice);
    }

    // 4. Text Search (using regex for partial matches)
    if (search && typeof search === 'string') {
      queryObj.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } }
      ];
    }

    // 5. Sorting
    const sortObj: any = {};
    if (sortBy && typeof sortBy === 'string') {
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortObj.createdAt = -1;
    }

    const items = await itemsCollection.find(queryObj).sort(sortObj).skip(skip).limit(limit).toArray();
    const total = await itemsCollection.countDocuments(queryObj);

    const populatedItems = await this.populateOwners(items);

    return { items: populatedItems, total };
  }

  static async getItemById(id: string, currentUserId?: string, isAdmin?: boolean) {
    const itemsCollection = this.getCollection();
    const objectId = new ObjectId(id);

    const item = await itemsCollection.findOne({ _id: objectId });
    if (!item) return null;

    if (item.status !== 'approved') {
      const isOwner = currentUserId && currentUserId === item.ownerId.toString();
      if (!isOwner && !isAdmin) {
        throw new Error('Access forbidden');
      }
    }

    const populated = await this.populateOwners([item]);
    return populated[0];
  }

  static async getRelatedItems(categoryId: string, excludeId: string) {
    const itemsCollection = this.getCollection();
    const items = await itemsCollection.find({
      category: categoryId,
      _id: { $ne: new ObjectId(excludeId) },
      status: 'approved',
    }).limit(4).toArray();
    
    return this.populateOwners(items);
  }

  static async createItem(data: Partial<ItemDocument>, userId: string) {
    const itemsCollection = this.getCollection();
    
    const newItem: Omit<ItemDocument, '_id'> = {
      ownerId: new ObjectId(userId),
      title: data.title as string,
      shortDescription: data.shortDescription as string,
      fullDescription: data.fullDescription as string,
      price: data.price as number,
      category: data.category as string,
      images: data.images as string[],
      quantity: data.quantity as number,
      location: data.location as string,
      avgRating: 0,
      reviewCount: 0,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await itemsCollection.insertOne(newItem as ItemDocument);
    return { _id: result.insertedId, ...newItem };
  }

  static async updateItem(id: string, updateData: Partial<ItemDocument>) {
    const itemsCollection = this.getCollection();
    const objectId = new ObjectId(id);

    updateData.updatedAt = new Date();

    await itemsCollection.updateOne({ _id: objectId }, { $set: updateData });
    return itemsCollection.findOne({ _id: objectId });
  }

  static async deleteItem(id: string) {
    const itemsCollection = this.getCollection();
    await itemsCollection.deleteOne({ _id: new ObjectId(id) });
  }

  static async getMyItems(userId: string, skip: number, limit: number) {
    const itemsCollection = this.getCollection();
    const queryObj = { ownerId: new ObjectId(userId) };

    const items = await itemsCollection.find(queryObj).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    const total = await itemsCollection.countDocuments(queryObj);

    const populatedItems = await this.populateOwners(items);

    return { items: populatedItems, total };
  }

  static async updateItemStatus(id: string, status: ItemDocument['status']) {
    const itemsCollection = this.getCollection();
    const objectId = new ObjectId(id);

    const result = await itemsCollection.updateOne(
      { _id: objectId },
      { $set: { status, updatedAt: new Date() } }
    );
    
    return result.matchedCount > 0;
  }
}
