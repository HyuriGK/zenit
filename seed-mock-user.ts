import { sql } from './src/lib/neon';

async function main() {
    console.log('Criando usuário mock no banco...');

    try {
        const userId = '12345678-user-mock-abcd';
        const resultado = await sql`
      INSERT INTO "User" (id, name, email, "createdAt", "updatedAt")
      VALUES (${userId}, 'Usuário Mock', 'mock@zenit.app', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
      RETURNING *;
    `;

        console.log('Usuário mock garantido:', resultado);
    } catch (error) {
        console.error('Erro:', error);
    }
}

main();
