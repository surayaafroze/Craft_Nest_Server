import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:1234As@localhost:5432/Postgresql-Craftnest-Project';
const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });

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
