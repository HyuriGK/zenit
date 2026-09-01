import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Only issue upload tokens for this feature's image namespace.
        if (!pathname.startsWith('anotacoes/')) {
          throw new Error('Caminho de upload inválido');
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Nothing to persist here: the editor stores the returned public URL.
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao preparar upload de imagem da anotação:', error);
    return NextResponse.json({ error: 'Não foi possível enviar a imagem.' }, { status: 400 });
  }
}
