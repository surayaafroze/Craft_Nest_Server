import { Request, Response, NextFunction } from 'express';
import { ItemService } from '../services/item.service';
import { ItemDocument } from '../types/item';
import { AuthenticatedRequest } from '../middleware/auth';

export const getItems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      search, 
      category, 
      minPrice, 
      maxPrice, 
      status, 
      sortBy, 
      sortOrder, 
      page = '1', 
      limit = '12' 
    } = req.query;

    console.log("getItems called with query:", req.query);

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const isAdmin = req.user?.role === 'admin';

    const { items, total } = await ItemService.getItems({
      search: search as string,
      category: category as string,
      minPrice: minPrice as string,
      maxPrice: maxPrice as string,
      status: status as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as string,
      page: pageNum,
      limit: limitNum,
      skip,
      isAdmin
    });

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      items: items.map(mapItemResponse),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getItemById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const currentUserId = req.user?.userId;
    const isAdmin = req.user?.role === 'admin';

    const item = await ItemService.getItemById(id, currentUserId, isAdmin);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json({ item: mapItemResponse(item) });
  } catch (error: any) {
    if (error.message === 'Access forbidden') {
      return res.status(403).json({ error: 'Access forbidden: Item is not approved' });
    }
    next(error);
  }
};

export const getRelatedItems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    // We first need to get the item to know its category
    const currentUserId = req.user?.userId;
    const isAdmin = req.user?.role === 'admin';

    const item = await ItemService.getItemById(id, currentUserId, isAdmin);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const relatedItems = await ItemService.getRelatedItems(item.category, id);

    res.status(200).json({
      items: relatedItems.map(mapItemResponse)
    });
  } catch (error) {
    next(error);
  }
};

export const createItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const newItem = await ItemService.createItem(req.body, req.user.userId);
    res.status(201).json({ message: 'Item created successfully', item: mapItemResponse(newItem as ItemDocument) });
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const currentUserId = req.user?.userId;
    const isAdmin = req.user?.role === 'admin';

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const item = await ItemService.getItemById(id, currentUserId, true);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.ownerId.toString() !== currentUserId && !isAdmin) {
      return res.status(403).json({ error: 'Access forbidden: You do not own this item' });
    }

    const updatedItem = await ItemService.updateItem(id, req.body);
    res.status(200).json({ message: 'Item updated successfully', item: updatedItem ? mapItemResponse(updatedItem) : null });
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const currentUserId = req.user?.userId;
    const isAdmin = req.user?.role === 'admin';

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const item = await ItemService.getItemById(id, currentUserId, true);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.ownerId.toString() !== currentUserId && !isAdmin) {
      return res.status(403).json({ error: 'Access forbidden: You do not own this item' });
    }

    await ItemService.deleteItem(id);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMyItems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const { items, total } = await ItemService.getMyItems(req.user.userId, skip, limitNum);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      items: items.map(mapItemResponse),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateItemStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const success = await ItemService.updateItemStatus(id, status);
    if (!success) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json({ message: 'Item status updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Helper function to map the MongoDB document to the response format (removes _id, returns id)
function mapItemResponse(item: ItemDocument) {
  return {
    id: item._id.toString(),
    ownerId: item.ownerId.toString(),
    owner: item.owner ? {
      name: item.owner.name,
      avatarUrl: item.owner.avatarUrl || null,
    } : undefined,
    title: item.title,
    shortDescription: item.shortDescription,
    fullDescription: item.fullDescription,
    price: item.price,
    category: item.category,
    images: item.images,
    quantity: item.quantity,
    location: item.location,
    avgRating: item.avgRating || 0,
    reviewCount: item.reviewCount || 0,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
