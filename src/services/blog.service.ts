import { prisma } from '../config/db';
import { BlogPostDocument } from '../types/blog';

export class BlogService {
  private static formatPost(post: any): BlogPostDocument {
    if (!post) return post;
    return {
      ...post,
      _id: post.id,
    };
  }

  public static async createBlog(data: { title: string; slug: string; coverImage: string; content: string; tags: string[] }): Promise<BlogPostDocument> {
    try {
      const post = await prisma.blogPost.create({
        data,
      });
      return this.formatPost(post);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Slug must be unique');
      }
      throw error;
    }
  }

  public static async updateBlog(slug: string, data: Partial<Omit<BlogPostDocument, '_id' | 'publishedAt'>>): Promise<BlogPostDocument | null> {
    try {
      const post = await prisma.blogPost.update({
        where: { slug },
        data,
      });
      return this.formatPost(post);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null;
      }
      if (error.code === 'P2002') {
        throw new Error('Slug must be unique');
      }
      throw error;
    }
  }

  public static async deleteBlog(slug: string): Promise<boolean> {
    try {
      await prisma.blogPost.delete({ where: { slug } });
      return true;
    } catch {
      return false;
    }
  }

  public static async getBlogList(): Promise<BlogPostDocument[]> {
    const posts = await prisma.blogPost.findMany({
      orderBy: { publishedAt: 'desc' },
    });
    return posts.map(this.formatPost);
  }

  public static async getBlogBySlug(slug: string): Promise<BlogPostDocument | null> {
    const post = await prisma.blogPost.findUnique({ where: { slug } });
    if (!post) return null;
    return this.formatPost(post);
  }
}
