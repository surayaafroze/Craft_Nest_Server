import { Request, Response } from 'express';
import { getDb } from '../config/db';

export const getTopContributors = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const users = await db.collection('users')
      .find({ role: 'artisan' })
      .limit(6)
      .toArray();
      
    // Fallback if no artisans exist
    const contributors = users.length > 0 ? users : await db.collection('users').find().limit(6).toArray();
    
    const safeContributors = contributors.map(u => ({
      id: u._id,
      name: u.name || 'Anonymous Artisan',
      email: u.email,
      avatar: u.image || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name || 'Craft'}`,
      role: u.role || 'user',
      sales: Math.floor(Math.random() * 100) + 10 // Mock sales data for the UI
    }));
    
    // If empty even after fallback, send mock data
    if (safeContributors.length === 0) {
      const mockContributors = [
        { id: '1', name: 'Elena Rostova', role: 'Ceramics', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Elena', sales: 120 },
        { id: '2', name: 'Marcus Thorne', role: 'Leather Goods', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Marcus', sales: 85 },
        { id: '3', name: 'Silas Miller', role: 'Woodworking', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Silas', sales: 230 },
        { id: '4', name: 'Amelia Pond', role: 'Jewelry', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Amelia', sales: 94 },
      ];
      res.json({ success: true, data: mockContributors });
      return;
    }
    
    res.json({ success: true, data: safeContributors });
  } catch (error) {
    console.error('Error fetching top contributors:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top contributors' });
  }
};

export const getBlogPreview = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const blogposts = await db.collection('blogposts')
      .find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();
      
    const previewData = blogposts.length >= 3 ? blogposts : [
      {
        id: 'mock1',
        title: 'The Art of Ceramic Glazing',
        excerpt: 'Discover the hidden techniques master artisans use to achieve perfect glass-like finishes on their pottery.',
        image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=800',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'mock2',
        title: 'Sustainable Leather Sourcing',
        excerpt: 'How ethical tanneries are changing the landscape of handmade leather goods without compromising quality.',
        image: 'https://images.unsplash.com/photo-1605333552097-fc6db2cdd74e?auto=format&fit=crop&q=80&w=800',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'mock3',
        title: 'Mastering Wood Joinery',
        excerpt: 'A beginner’s guide to understanding dovetails, mortise, and tenon joints in custom furniture design.',
        image: 'https://images.unsplash.com/photo-1542013898-752178bd0268?auto=format&fit=crop&q=80&w=800',
        createdAt: new Date().toISOString(),
      }
    ];

    res.json({ success: true, data: previewData });
  } catch (error) {
    console.error('Error fetching blog preview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blog preview' });
  }
};

export const subscribeNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      res.status(400).json({ success: false, message: 'Valid email is required' });
      return;
    }
    
    const db = getDb();
    const subscribers = db.collection('newslettersubscribers');
    
    const existing = await subscribers.findOne({ email });
    if (existing) {
      res.status(400).json({ success: false, message: 'Email is already subscribed' });
      return;
    }
    
    await subscribers.insertOne({
      email,
      createdAt: new Date()
    });
    
    res.json({ success: true, message: 'Successfully subscribed to the newsletter!' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ success: false, message: 'Failed to subscribe to newsletter' });
  }
};
