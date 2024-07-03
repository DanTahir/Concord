// import { Pool } from 'pg';

// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: parseInt(process.env.DB_PORT || '5432'),
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

// export const queryTyped = async <T>(text: string, params?: any[]): Promise<T[]> => {
//   const res = await pool.query(text, params);
//   return res.rows;
// };

// export const query = async (text: string, params?: any[]): Promise<void> => {
//   await pool.query(text, params);
// };

import { Client } from 'pg';
import fs from 'fs';

// SSL configuration
const ssl = process.env.DB_SSL === 'true'
  ? {
      rejectUnauthorized: false,
      ca: process.env.DB_SSL_CA ? fs.readFileSync(process.env.DB_SSL_CA) : undefined,
      key: process.env.DB_SSL_KEY ? fs.readFileSync(process.env.DB_SSL_KEY) : undefined,
      cert: process.env.DB_SSL_CERT ? fs.readFileSync(process.env.DB_SSL_CERT) : undefined,
    }
  : undefined;

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
    ssl: {
      rejectUnauthorized: false
    }
});

// const client = new Client({
//   connectionString: process.env.POSTGRES_URL
// });

export const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (err) {
    console.error('Connection error', err);
  }
};

// Connect to the database when the application starts
client.connect()
  .then(() => console.log('Connected to the database'))
  .catch((err) => console.error('Connection error', err.stack));

export const queryTyped = async <T>(text: string, params?: any[]): Promise<T[]> => {
  try {
    const res = await client.query(text, params);
    return res.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const query = async (text: string, params?: any[]): Promise<void> => {
  try {
    await client.query(text, params);
  } catch (error) {
    console.error('Database execute error:', error);
    throw error;
  }
};

// Close the connection when the application ends
process.on('exit', () => {
  client.end().then(() => console.log('Disconnected from the database'));
});