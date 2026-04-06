const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Read .env manually
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = dotenv.parse(envContent);

const sql = neon(env.DATABASE_URL);

async function fix() {
    try {
        console.log("Checking table structure...");
        // In PostgreSQL, column names are case sensitive if quoted, otherwise case insensitive. 
        // Prisma uses double quotes, so it's "valorFipe".
        const query = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Veiculo'
        `;
        const result = await sql(query);
        
        const columnNames = result.map(c => c.column_name);
        console.log("Columns found:", columnNames.join(', '));
        
        const hasValorFipe = columnNames.includes('valorFipe');
        
        if (!hasValorFipe) {
            console.log("Column 'valorFipe' is missing. Adding it...");
            await sql('ALTER TABLE "Veiculo" ADD COLUMN "valorFipe" TEXT');
            console.log("Column added successfully.");
        } else {
            console.log("Column 'valorFipe' already exists.");
        }
    } catch (error) {
        console.error("Error fixing database:", error);
    }
}

fix();
