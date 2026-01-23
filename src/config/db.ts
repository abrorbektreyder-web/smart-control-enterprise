import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

// Xavfsizlik qatlami: DELETE so'rovini bloklaydi
export const query = async (text: string, params?: any[]) => {
  if (text.trim().toUpperCase().startsWith('DELETE')) {
    throw new Error('XAVFSIZLIK: Tizimda DELETE operatsiyasi taqiqlangan!');
  }
  return pool.query(text, params);
};

export default pool;
