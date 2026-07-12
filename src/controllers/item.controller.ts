import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db';
import { getPaginationParams } from '../utils/pagination';
import { verifyToken } from '../utils/jwt';
import { ROLES } from '../constants/roles';
import { AuthenticatedRequest } from '../middleware/auth';

// Helper to optionally authenticate a request to inspect admin permissions in public routes
const getOptionalUser = (req: Request) => {
  try {
    let token: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;)\s*(?:better-auth\.session_token|token)\s*=\s*([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
};

export const getItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, minPrice, maxPrice, status, sortBy, sortOrder } = req.query;
    const { page, limit, skip } = getPaginationParams(req.query);
    const db = getDb();
    const itemsCollection = db.collection('items');

    const queryObj: any = {};

    // 1. Handle Role Gating on Item status
    const optionalUser = getOptionalUser(req);
    const isAdmin = optionalUser && optionalUser.role === ROLES.ADMIN;

    if (isAdmin && status && typeof status === 'string') {
      queryObj.status = status;
    } else {
      queryObj.status = 'approved';
    }

    // 2. Filters
    if (category && typeof category === 'string') {
      queryObj.category = category;
    }

    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = Number(minPrice);
      if (maxPrice) queryObj.price.$lte = Number(maxPrice);
    }

    // 3. Search (using text index)
    if (search && typeof search === 'string') {
      queryObj.$text = { $search: search };
    }

    // 4. Sorting
    const sortObj: any = {};
    if (sortBy && typeof sortBy === 'string') {
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortObj.createdAt = -1;
    }

    // Execute query
    const items = await itemsCollection
      .find(queryObj)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await itemsCollection.countDocuments(queryObj);

    res.status(200).json({
      items: items.map((item) => ({
        id: item._id.toString(),
        title: item.title,
        shortDescription: item.shortDescription,
        description: item.description,
        category: item.category,
        price: item.price,
        imageUrls: item.imageUrls,
        ownerId: item.ownerId.toString(),
        status: item.status,
        tags: item.tags,
        quantity: item.quantity,
        location: item.location,
        avgRating: item.avgRating || 0,
        reviewCount: item.reviewCount || 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getItemById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }
    const db = getDb();
    const itemsCollection = db.collection('items');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    const item = await itemsCollection.findOne({ _id: objectId });
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    // Non-approved items can only be viewed by owner or admin
    if (item.status !== 'approved') {
      const optionalUser = getOptionalUser(req);
      const isOwner = optionalUser && optionalUser.userId === item.ownerId.toString();
      const isAdmin = optionalUser && optionalUser.role === ROLES.ADMIN;

      if (!isOwner && !isAdmin) {
        res.status(403).json({ error: 'Access forbidden' });
        return;
      }
    }

    res.status(200).json({
      item: {
        id: item._id.toString(),
        title: item.title,
        shortDescription: item.shortDescription,
        description: item.description,
        category: item.category,
        price: item.price,
        imageUrls: item.imageUrls,
        ownerId: item.ownerId.toString(),
        status: item.status,
        tags: item.tags,
        quantity: item.quantity,
        location: item.location,
        avgRating: item.avgRating || 0,
        reviewCount: item.reviewCount || 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRelatedItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }
    const db = getDb();
    const itemsCollection = db.collection('items');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    const currentItem = await itemsCollection.findOne({ _id: objectId });
    if (!currentItem) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const relatedItems = await itemsCollection
      .find({
        category: currentItem.category,
        _id: { $ne: currentItem._id },
        status: 'approved',
      })
      .limit(4)
      .toArray();

    res.status(200).json({
      items: relatedItems.map((item) => ({
        id: item._id.toString(),
        title: item.title,
        shortDescription: item.shortDescription,
        price: item.price,
        imageUrls: item.imageUrls,
        category: item.category,
        ownerId: item.ownerId.toString(),
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { title, shortDescription, description, category, price, imageUrls, tags } = req.body;
    const db = getDb();
    const itemsCollection = db.collection('items');

    const newItem = {
      title,
      shortDescription,
      description,
      category,
      price,
      imageUrls,
      ownerId: new ObjectId(req.user.userId),
      status: 'pending',
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await itemsCollection.insertOne(newItem);

    res.status(201).json({
      message: 'Item created successfully and is pending admin approval',
      item: {
        id: result.insertedId.toString(),
        ...newItem,
        ownerId: req.user.userId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }
    const updateData = req.body;
    const db = getDb();
    const itemsCollection = db.collection('items');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    // Set updatedAt field
    updateData.updatedAt = new Date();

    await itemsCollection.updateOne({ _id: objectId }, { $set: updateData });

    const updatedItem = await itemsCollection.findOne({ _id: objectId });

    res.status(200).json({
      message: 'Item updated successfully',
      item: updatedItem ? {
        id: updatedItem._id.toString(),
        title: updatedItem.title,
        shortDescription: updatedItem.shortDescription,
        description: updatedItem.description,
        category: updatedItem.category,
        price: updatedItem.price,
        imageUrls: updatedItem.imageUrls,
        ownerId: updatedItem.ownerId.toString(),
        status: updatedItem.status,
        tags: updatedItem.tags,
        createdAt: updatedItem.createdAt,
        updatedAt: updatedItem.updatedAt,
      } : null,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }
    const db = getDb();
    const itemsCollection = db.collection('items');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    await itemsCollection.deleteOne({ _id: objectId });

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMyItems = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { page, limit, skip } = getPaginationParams(req.query);
    const db = getDb();
    const itemsCollection = db.collection('items');

    const queryObj = { ownerId: new ObjectId(req.user.userId) };

    const items = await itemsCollection
      .find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await itemsCollection.countDocuments(queryObj);

    res.status(200).json({
      items: items.map((item) => ({
        id: item._id.toString(),
        title: item.title,
        shortDescription: item.shortDescription,
        description: item.description,
        category: item.category,
        price: item.price,
        imageUrls: item.imageUrls,
        ownerId: item.ownerId.toString(),
        status: item.status,
        tags: item.tags,
        quantity: item.quantity,
        location: item.location,
        avgRating: item.avgRating || 0,
        reviewCount: item.reviewCount || 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateItemStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }
    const { status } = req.body;
    const db = getDb();
    const itemsCollection = db.collection('items');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      res.status(400).json({ error: 'Invalid item ID format' });
      return;
    }

    const result = await itemsCollection.updateOne(
      { _id: objectId },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    res.status(200).json({ message: `Item status updated to ${status} successfully` });
  } catch (error) {
    next(error);
  }
};
