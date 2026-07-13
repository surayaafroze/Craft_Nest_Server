import { Request, Response } from 'express';
import { getDb } from '../config/db';
import { CategoryDocument } from '../types/category';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const categories = await db.collection<CategoryDocument>('categories').find().toArray();
    
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
};
