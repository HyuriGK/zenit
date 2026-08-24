import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

export async function GET() {
    try {
        console.log("Iniciando migração manual via API...");
        
        // Adicionar a coluna valorFipe na tabela Veiculo
        // Usamos direct string literal para garantir que não haja erros de interpolação
        await sql`ALTER TABLE "Veiculo" ADD COLUMN IF NOT EXISTS "valorFipe" TEXT`;
        
        console.log("Migração concluída com sucesso!");
        
        return NextResponse.json({ 
            success: true, 
            message: "Coluna 'valorFipe' adicionada com sucesso ao banco de dados!",
            instruction: "Agora você pode fechar esta aba e tentar salvar o veículo novamente no Azimov."
        });
    } catch (error) {
        console.error("Erro na migração manual:", error);
        return NextResponse.json({ 
            success: false, 
            error: (error as Error).message,
            tip: "Certifique-se de que o banco de dados Neon está acessível."
        }, { status: 500 });
    }
}
