import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const connectDb = async (): Promise<PrismaClient> => {
  await prisma.$connect();
  return prisma;
};

export const getDb = (): PrismaClient => {
  return prisma;
};

export const closeDb = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log('PostgreSQL Prisma connection closed.');
};
