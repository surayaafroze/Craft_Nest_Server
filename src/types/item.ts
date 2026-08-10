export interface ItemDocument {
  id?: string;
  _id?: string;
  ownerId: string;
  owner?: {
    name: string;
    avatarUrl?: string | null;
  };
  title: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  category: string;
  images: string[];
  quantity: number;
  location: string;
  avgRating: number;
  reviewCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
