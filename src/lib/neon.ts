import { neon } from '@neondatabase/serverless';

// The DATABASE_URL is automatically picked up from process.env
const connectionString = process.env.DATABASE_URL!;

// We export 'sql', a template tag function to safely execute raw SQL queries
export const sql = neon(connectionString);
