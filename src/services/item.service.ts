import { prisma } from '../config/db';
import { ItemDocument } from '../types/item';
import { ItemStatus } from '@prisma/client';

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
  private static formatItem(item: any): ItemDocument {
    if (!item) return item;
    return {
      ...item,
      _id: item.id,
      owner: item.owner ? { name: item.owner.name, avatarUrl: item.owner.avatarUrl } : item.owner,
    };
  }

  static async getItems(params: GetItemsParams) {
    const { search, category, minPrice, maxPrice, status, sortBy, sortOrder, skip, limit, isAdmin } = params;

    const where: any = {};

    // 1. Status Filter
    if (isAdmin && status && typeof status === 'string') {
      where.status = status as ItemStatus;
    } else {
      where.status = ItemStatus.approved;
    }

    // 2. Exact Match Filters
    if (category && typeof category === 'string') {
      where.category = category;
    }

    // 3. Range Filters
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    // 4. Text Search
    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 5. Sorting
    const orderBy: any = {};
    if (sortBy && typeof sortBy === 'string') {
      orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const items = await prisma.item.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        owner: {
          select: { name: true, avatarUrl: true }
        }
      }
    });

    const total = await prisma.item.count({ where });

    return { items: items.map(this.formatItem), total };
  }

  static async getItemById(id: string, currentUserId?: string, isAdmin?: boolean) {
    let item: any;
    try {
      item = await prisma.item.findUnique({
        where: { id },
        include: {
          owner: {
            select: { name: true, avatarUrl: true }
          }
        }
      });
    } catch {
      return null;
    }

    if (!item) return null;

    if (item.status !== ItemStatus.approved) {
      const isOwner = currentUserId && currentUserId === item.ownerId;
      if (!isOwner && !isAdmin) {
        throw new Error('Access forbidden');
      }
    }

    return this.formatItem(item);
  }

  static async getRelatedItems(categoryId: string, excludeId: string) {
    const items = await prisma.item.findMany({
      where: {
        category: categoryId,
        id: { not: excludeId },
        status: ItemStatus.approved,
      },
      take: 4,
      include: {
        owner: {
          select: { name: true, avatarUrl: true }
        }
      }
    });
    
    return items.map(this.formatItem);
  }

  static async createItem(data: Partial<ItemDocument>, userId: string) {
    const newItem = await prisma.item.create({
      data: {
        ownerId: userId,
        title: data.title as string,
        shortDescription: data.shortDescription as string,
        fullDescription: data.fullDescription as string,
        price: Number(data.price),
        category: data.category as string,
        images: data.images as string[],
        quantity: Number(data.quantity),
        location: data.location as string,
        avgRating: 0,
        reviewCount: 0,
        status: ItemStatus.pending,
      },
      include: {
        owner: {
          select: { name: true, avatarUrl: true }
        }
      }
    });

    return this.formatItem(newItem);
  }

  static async updateItem(id: string, updateData: Partial<ItemDocument>) {
    const { _id, id: itemId, owner, ownerId, createdAt, updatedAt, ...cleanData } = updateData as any;

    if (cleanData.price !== undefined) cleanData.price = Number(cleanData.price);
    if (cleanData.quantity !== undefined) cleanData.quantity = Number(cleanData.quantity);

    const updatedItem = await prisma.item.update({
      where: { id },
      data: cleanData,
      include: {
        owner: {
          select: { name: true, avatarUrl: true }
        }
      }
    });

    return this.formatItem(updatedItem);
  }

  static async deleteItem(id: string) {
    await prisma.item.delete({ where: { id } });
  }

  static async getMyItems(userId: string, skip: number, limit: number) {
    const where = { ownerId: userId };

    const items = await prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        owner: {
          select: { name: true, avatarUrl: true }
        }
      }
    });

    const total = await prisma.item.count({ where });

    return { items: items.map(this.formatItem), total };
  }

  static async updateItemStatus(id: string, status: ItemDocument['status']) {
    try {
      await prisma.item.update({
        where: { id },
        data: { status: status as ItemStatus }
      });
      return true;
    } catch {
      return false;
    }
  }
}
