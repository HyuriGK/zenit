# BUG-003: Vazamento de Informação em Conta OAuth - Forgot Password

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | BUG-003 |
| **Título** | Vazamento de Informação sobre Tipo de Conta (OAuth vs Senha) |
| **Gravidade** | **MÉDIA** |
| **CVSS Score** | 5.3 (Médio) |
| **OWASP** | A01:2021 - Broken Access Control |
| **CWE** | CWE-200: Exposure of Sensitive Information |
| **Endpoint Afetado** | `/api/auth/forgot-password` |
| **Data de Identificação** | 2026-01-16 |

---

## Descrição

O endpoint `/api/auth/forgot-password` revela se uma conta utiliza login social (OAuth) ao retornar a mensagem específica "Esta conta usa login social. Não é possível redefinir senha." quando o usuário tenta recuperar a senha de uma conta criada via Google OAuth.

Esta informação permite que um atacante identifique:
1. Que o email existe no sistema
2. Que a conta foi criada usando Google OAuth

---

## Ação Realizada e Payload

### Teste de Vazamento de Informação

**Endpoint:** `POST /api/auth/forgot-password`

**Payload para conta com senha (normal):**
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario.normal@teste.com"}'
```

**Resposta (conta com senha):**
```json
{
  "message": "Se o email existir, você receberá instruções de redefinição"
}
// HTTP Status: 200 OK
```

**Payload para conta OAuth (Google):**
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario.google@gmail.com"}'
```

**Resposta (conta OAuth - VULNERÁVEL):**
```json
{
  "error": "Esta conta usa login social. Não é possível redefinir senha."
}
// HTTP Status: 400 Bad Request
```

**Payload para email inexistente:**
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "naoexiste@teste.com"}'
```

**Resposta (email não existe):**
```json
{
  "message": "Se o email existir, você receberá instruções de redefinição"
}
// HTTP Status: 200 OK
```

---

## Análise Técnica do Código

### Arquivo: `src/app/api/auth/forgot-password/route.ts` (Linhas 39-45)

```typescript
// Verifica se usuário tem senha (não é OAuth)
if (!user.password) {
  return NextResponse.json(
    { error: 'Esta conta usa login social. Não é possível redefinir senha.' },  // VULNERÁVEL
    { status: 400 }  // Status diferenciado
  );
}
```

**Problemas identificados:**
1. Resposta diferenciada revela existência do email E tipo de conta
2. Status HTTP 400 diferente dos outros cenários (200)
3. Contradiz a proteção implementada para emails inexistentes (linha 30-36)

---

## Causa Raiz

1. **Lógica inconsistente**: O endpoint protege contra enumeração para emails inexistentes, mas revela informação para contas OAuth
2. **Mensagem de erro específica**: Confirma tanto a existência do email quanto o método de autenticação
3. **Status code diferenciado**: Permite identificação automática do tipo de conta

---

## Impacto

| Cenário de Ataque | Descrição |
|-------------------|-----------|
| **Reconhecimento** | Atacante descobre quais usuários usam Google OAuth |
| **Phishing Direcionado** | Pode criar páginas falsas do Google para esses usuários |
| **Engenharia Social** | Saber que alguém usa Google pode ser usado em ataques |
| **Account Takeover** | Foco em comprometer contas Google em vez de força bruta |

---

## Ação Corretiva Sugerida

### Correção: Resposta Uniforme

```typescript
// src/app/api/auth/forgot-password/route.ts

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedFields = forgotPasswordSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const { email } = validatedFields.data;
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // CORREÇÃO: Sempre retornar mesma resposta genérica
    // Independente se usuário existe, não existe, ou é OAuth
    const genericResponse = {
      message: 'Se o email existir e tiver senha cadastrada, você receberá instruções de redefinição'
    };

    // Se usuário não existe - retorna resposta genérica
    if (!user) {
      // Adicionar delay para equalizar timing
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
      return NextResponse.json(genericResponse, { status: 200 });
    }

    // Se usuário é OAuth (sem senha) - retorna MESMA resposta genérica
    // Mas NÃO envia email
    if (!user.password) {
      // Adicionar delay para equalizar timing
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
      return NextResponse.json(genericResponse, { status: 200 });
    }

    // Usuário tem senha - gera token e envia email
    const resetToken = await generatePasswordResetToken(email);
    await sendPasswordResetEmail(email, resetToken.token, user.name || undefined);

    return NextResponse.json(genericResponse, { status: 200 });

  } catch (error) {
    console.error('Erro ao processar esqueci senha:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
```

---

## Comparação: Comportamento Atual vs Esperado

| Cenário | Comportamento Atual | Comportamento Esperado |
|---------|---------------------|------------------------|
| Email não existe | 200 + mensagem genérica | 200 + mensagem genérica |
| Email existe (senha) | 200 + mensagem genérica | 200 + mensagem genérica |
| Email existe (OAuth) | **400 + "usa login social"** | 200 + mensagem genérica |

---

## Referências

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [CWE-200: Exposure of Sensitive Information](https://cwe.mitre.org/data/definitions/200.html)

---

## Status

| Campo | Valor |
|-------|-------|
| **Status** | **FECHADO** |
| **Data de Correção** | 2026-01-16 |
| **Correção Aplicada** | Resposta genérica para todos os cenários |

---

## Correção Implementada

### Arquivo Modificado: `src/app/api/auth/forgot-password/route.ts`

**Mudanças:**
1. Resposta genérica para todos os cenários (usuário existe, não existe, ou é OAuth)
2. Status HTTP 200 para todos os casos
3. Delay artificial para equalizar timing
4. Rate limiting adicionado

**Nova resposta (para TODOS os cenários):**
```json
{
  "message": "Se o email existir e tiver senha cadastrada, você receberá instruções de redefinição."
}
// HTTP Status: 200 OK (sempre)
```

**Comportamento:**
- Email não existe: Retorna mensagem genérica (não envia email)
- Email existe (OAuth): Retorna mesma mensagem (não envia email)
- Email existe (com senha): Envia email, retorna mesma mensagem
