export interface ReviewDocument {
  id?: string;
  _id?: string;
  itemId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}
