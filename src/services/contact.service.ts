import { prisma } from '../config/db';
import { ContactMessageDocument } from '../types/contact';
import { ContactStatus } from '@prisma/client';

export class ContactService {
  private static formatMessage(msg: any): ContactMessageDocument {
    if (!msg) return msg;
    return {
      ...msg,
      _id: msg.id,
    };
  }

  public static async submitMessage(data: { name: string; email: string; subject: string; message: string }): Promise<ContactMessageDocument> {
    const msg = await prisma.contactMessage.create({
      data: {
        ...data,
        status: ContactStatus.new,
      },
    });
    return this.formatMessage(msg);
  }

  public static async getAllMessages(): Promise<ContactMessageDocument[]> {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return messages.map(this.formatMessage);
  }

  public static async updateStatus(id: string, status: 'new' | 'read' | 'responded'): Promise<ContactMessageDocument | null> {
    try {
      const updated = await prisma.contactMessage.update({
        where: { id },
        data: { status: status as ContactStatus },
      });
      return this.formatMessage(updated);
    } catch {
      return null;
    }
  }

  public static async deleteMessage(id: string): Promise<boolean> {
    try {
      await prisma.contactMessage.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
