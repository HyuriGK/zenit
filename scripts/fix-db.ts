import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function fix() {
    try {
        console.log("Checking table structure...");
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Veiculo'
        `;
        
        console.log("Columns found:", columns.map(c => c.column_name).join(', '));
        
        const hasValorFipe = columns.some(c => c.column_name === 'valorFipe');
        
        if (!hasValorFipe) {
            console.log("Column 'valorFipe' is missing. Adding it...");
            await sql`ALTER TABLE "Veiculo" ADD COLUMN "valorFipe" TEXT`;
            console.log("Column added successfully.");
        } else {
            console.log("Column 'valorFipe' already exists.");
        }
    } catch (error) {
        console.error("Error fixing database:", error);
    }
}

fix();
