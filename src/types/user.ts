export interface UserDocument {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  passwordHash: string | null;
  authProvider: 'local' | 'google';
  googleId: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin';
  bio: string;
  location: string;
  phone: string;
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}
