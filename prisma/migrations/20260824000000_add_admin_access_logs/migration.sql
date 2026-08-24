ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'OPERADOR';

UPDATE "User"
SET "role" = CASE
  WHEN lower("email") = 'brasil.hyuri@gmail.com' THEN 'ADMIN'
  ELSE 'OPERADOR'
END;

CREATE TABLE IF NOT EXISTS "LogAcesso" (
  "id" TEXT NOT NULL,
  "rota" TEXT NOT NULL,
  "acao" TEXT NOT NULL DEFAULT 'ACESSOU_TELA',
  "dispositivo" TEXT,
  "detalhes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  CONSTRAINT "LogAcesso_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LogAcesso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "LogAcesso_createdAt_idx" ON "LogAcesso"("createdAt");
CREATE INDEX IF NOT EXISTS "LogAcesso_userId_createdAt_idx" ON "LogAcesso"("userId", "createdAt");
