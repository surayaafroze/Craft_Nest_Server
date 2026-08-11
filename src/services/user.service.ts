import { prisma } from '../config/db';
import { UserDocument } from '../types/user';
import { UserRole, UserStatus } from '@prisma/client';

export class UserService {
  private static formatUser(user: any) {
    if (!user) return null;
    const { passwordHash, ...rest } = user;
    return {
      ...rest,
      _id: user.id,
    };
  }

  public static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return this.formatUser(user);
  }

  public static async updateUser(userId: string, updateData: Partial<UserDocument>) {
    const { _id, id, email, passwordHash, role, authProvider, googleId, status, createdAt, ...allowedUpdates } = updateData as any;

    if (Object.keys(allowedUpdates).length === 0) {
      return null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: allowedUpdates,
    });

    return this.formatUser(updatedUser);
  }

  public static async getUsers(skip?: number, limit?: number) {
    const where = {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...(skip !== undefined ? { skip } : {}),
        ...(limit !== undefined ? { take: limit } : {}),
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => this.formatUser(user)),
      total
    };
  }

  public static async updateUserStatus(userId: string, status: string) {
    let updateDoc: any = {};
    if (status === 'admin') {
      updateDoc = { role: UserRole.admin };
    } else {
      updateDoc = { status: status as UserStatus, role: UserRole.user };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateDoc,
    });

    return this.formatUser(updatedUser);
  }
}
