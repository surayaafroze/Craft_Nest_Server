export interface WishlistDocument {
  id?: string;
  _id?: string;
  userId: string;
  itemIds?: string[];
  updatedAt: Date;
}
