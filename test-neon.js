require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function test() {
    const sql = neon(process.env.DATABASE_URL);
    try {
        const rows = await sql`SELECT * FROM "AtivoInvestimento" ORDER BY "createdAt" DESC, "nome" ASC`;
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
