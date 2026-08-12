import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:1234As@localhost:5432/Postgresql-Craftnest-Project';

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const isCloudDb = connectionString.includes('neon.tech') || connectionString.includes('sslmode=require');

const pool = new Pool({
  connectionString,
  ssl: (isProduction || isCloudDb) ? { rejectUnauthorized: false } : false,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export const connectDb = async (): Promise<PrismaClient> => {
  try {
    await prisma.$connect();
    return prisma;
  } catch (error) {
    console.error('Database connection error in connectDb:', error);
    throw error;
  }
};

export const getDb = (): PrismaClient => {
  return prisma;
};

export const closeDb = async (): Promise<void> => {
  await prisma.$disconnect();
  await pool.end();
  console.log('PostgreSQL Prisma connection closed.');
};
