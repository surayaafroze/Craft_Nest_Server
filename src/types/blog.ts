export interface BlogPostDocument {
  id?: string;
  _id?: string;
  title: string;
  slug: string;
  coverImage: string;
  content: string;
  tags: string[];
  publishedAt: Date;
}
