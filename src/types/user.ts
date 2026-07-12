import { ObjectId } from 'mongodb';

export interface UserDocument {
  _id?: ObjectId;
  name: string;
  email: string;                 // unique index
  passwordHash: string | null;   // null for Google-only accounts
  authProvider: 'local' | 'google';
  googleId: string | null;       // unique sparse index
  avatarUrl: string | null;      // ImgBB URL or Google profile picture URL
  role: 'user' | 'admin';
  bio: string;
  location: string;
  phone: string;
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}
