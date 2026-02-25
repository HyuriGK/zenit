# BUG-002: Enumeração de Usuários no Endpoint de Registro

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **ID** | BUG-002 |
| **Título** | Enumeração de Usuários via Endpoint de Registro |
| **Gravidade** | **ALTA** |
| **CVSS Score** | 7.5 (Alto) |
| **OWASP** | A01:2021 - Broken Access Control |
| **CWE** | CWE-204: Observable Response Discrepancy |
| **Endpoint Afetado** | `/api/auth/register` |
| **Data de Identificação** | 2026-01-16 |

---

## Descrição

O endpoint de registro `/api/auth/register` retorna uma mensagem de erro específica quando um email já está cadastrado no sistema ("Email já cadastrado"). Esta resposta diferenciada permite que um atacante enumere quais emails estão registrados na plataforma, facilitando ataques direcionados como phishing, credential stuffing e engenharia social.

---

## Ação Realizada e Payload

### Teste de Enumeração

**Endpoint:** `POST /api/auth/register`

**Payload para email NÃO cadastrado:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Usuario",
    "email": "naoexiste123456@teste.com",
    "password": "Senha123Forte"
  }'
```

**Resposta (email não existe):**
```json
{
  "message": "Usuário criado com sucesso! Verifique seu email para ativar sua conta.",
  "user": {
    "id": "xxx",
    "name": "Teste Usuario",
    "email": "naoexiste123456@teste.com",
    "plano": "FREE",
    "createdAt": "2026-01-16T..."
  }
}
// HTTP Status: 201 Created
```

**Payload para email JÁ cadastrado:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Usuario",
    "email": "usuario.existente@teste.com",
    "password": "Senha123Forte"
  }'
```

**Resposta (email já existe):**
```json
{
  "error": "Email já cadastrado"
}
// HTTP Status: 409 Conflict
```

### Script de Enumeração Automatizada

```python
# Payload de ataque para enumeração em massa
import requests

emails_to_test = [
    "admin@empresa.com",
    "contato@empresa.com",
    "financeiro@empresa.com",
    "rh@empresa.com",
    # ... lista de emails potenciais
]

valid_emails = []

for email in emails_to_test:
    response = requests.post(
        "http://localhost:3000/api/auth/register",
        json={
            "name": "Test",
            "email": email,
            "password": "Test123456"
        }
    )

    if response.status_code == 409:
        valid_emails.append(email)
        print(f"[ENCONTRADO] {email}")
    else:
        print(f"[NÃO EXISTE] {email}")

print(f"\nEmails válidos encontrados: {len(valid_emails)}")
```

---

## Análise Técnica do Código

### Arquivo: `src/app/api/auth/register/route.ts` (Linhas 25-35)

```typescript
// Verificar se email já existe
const existingUser = await prisma.user.findUnique({
  where: { email },
});

if (existingUser) {
  return NextResponse.json(
    { error: 'Email já cadastrado' },  // <-- VULNERABILIDADE: Mensagem específica
    { status: 409 }                     // <-- VULNERABILIDADE: Status code diferenciado
  );
}
```

**Problemas identificados:**
1. Mensagem de erro explícita revela existência do email
2. Status HTTP 409 diferencia resposta de email existente vs não existente
3. Ausência de delay/timing uniforme nas respostas

---

## Causa Raiz

1. **Mensagem de erro específica** que confirma a existência do email
2. **Status HTTP diferenciado** (409 vs 201) permitindo identificação automática
3. **Ausência de timing uniforme** nas respostas (respostas para emails existentes são mais rápidas pois não precisam criar usuário)
4. **Falta de CAPTCHA** para dificultar automação

---

## Impacto

| Cenário de Ataque | Descrição |
|-------------------|-----------|
| **Phishing Direcionado** | Atacante descobre emails válidos e envia emails de phishing personalizados |
| **Credential Stuffing** | Lista de emails validados usada em ataques com senhas vazadas |
| **Engenharia Social** | Informação de que alguém usa o serviço pode ser usada em ataques |
| **Preparação de Ataques** | Mapeamento de usuários para ataques futuros |
| **Spam Direcionado** | Emails confirmados como válidos recebem spam/malware |

---

## Ação Corretiva Sugerida

### Solução Recomendada: Resposta Genérica + Email de Confirmação

```typescript
// src/app/api/auth/register/route.ts

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // CORREÇÃO: Sempre retornar mesma resposta
    // Independente se email existe ou não
    if (existingUser) {
      // Se usuário já existe, enviar email informando
      // (apenas se email não foi verificado, enviar novo link)
      if (!existingUser.emailVerified) {
        const verificationToken = await generateVerificationToken(email);
        await sendVerificationEmail(email, verificationToken.token, existingUser.name || name);
      }

      // IMPORTANTE: Adicionar delay artificial para equalizar timing
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 500));

      // Retornar MESMA resposta genérica
      return NextResponse.json(
        {
          message: 'Se este email for válido, você receberá instruções para continuar.'
        },
        { status: 200 }  // Mesmo status code
      );
    }

    // Criar novo usuário normalmente
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(email, verificationToken.token, name);

    // MESMA resposta genérica para novos usuários
    return NextResponse.json(
      {
        message: 'Se este email for válido, você receberá instruções para continuar.'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao processar registro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

### Atualização no Frontend

```typescript
// src/app/(auth)/register/page.tsx

// Alterar mensagem de sucesso:
if (response.ok) {
  // Sucesso - mostrar mensagem genérica
  alert('Verifique seu email para ativar sua conta. Se o email já estiver cadastrado, você receberá instruções de acesso.');
  router.push('/login');
}
```

### Medidas Adicionais

1. **Implementar CAPTCHA** após 3 tentativas de registro
2. **Rate limiting** específico por IP para o endpoint de registro
3. **Logging de tentativas** suspeitas para análise de segurança
4. **Timing uniforme** em todas as respostas

---

## Comparação: Comportamento Atual vs Esperado

| Cenário | Comportamento Atual | Comportamento Esperado |
|---------|---------------------|------------------------|
| Email não existe | Status 201 + dados do usuário | Status 200 + mensagem genérica |
| Email já existe | Status 409 + "Email já cadastrado" | Status 200 + mensagem genérica |
| Tempo de resposta | Variável (~200ms vs ~800ms) | Uniforme (~1000ms) |

---

## Referências

- [OWASP Testing Guide - Testing for Account Enumeration](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account)
- [CWE-204: Observable Response Discrepancy](https://cwe.mitre.org/data/definitions/204.html)
- [Auth0 Best Practices](https://auth0.com/blog/prevent-credential-stuffing-attacks/)

---

## Status

| Campo | Valor |
|-------|-------|
| **Status** | **FECHADO** |
| **Data de Correção** | 2026-01-16 |
| **Correção Aplicada** | Resposta genérica + delay artificial para equalizar timing |

---

## Correção Implementada

### Arquivo Modificado: `src/app/api/auth/register/route.ts`

**Mudanças:**
1. Resposta genérica para ambos os casos (email existe ou não)
2. Status HTTP 200 para todos os cenários de sucesso
3. Delay artificial de 200-500ms para equalizar timing
4. Se email já existe e não verificado, reenvia email de verificação
5. Sanitização do campo nome para prevenir XSS

**Nova resposta:**
```json
{
  "message": "Se o email for válido, você receberá instruções para ativar sua conta."
}
// HTTP Status: 200 OK (sempre)
```

**Comportamento:**
- Email não existe: Cria usuário, envia email, retorna mensagem genérica
- Email existe (não verificado): Reenvia email, retorna mesma mensagem
- Email existe (verificado): Retorna mesma mensagem (não envia email)
