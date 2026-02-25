# 🎮 Roadmap: Sistema de Biblioteca e Gamificação

> **Documento técnico para reestruturação da Biblioteca e implementação de Sistema de Gamificação**
>
> **Última atualização**: 2026-01-13
> **Autor**: Gerente de Produto & Arquiteto de Software
> **Status**: Em Planejamento

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Contexto Atual](#-contexto-atual)
3. [Objetivos Estratégicos](#-objetivos-estratégicos)
4. [Arquitetura de Dados](#-arquitetura-de-dados)
5. [Roadmap por Fases](#-roadmap-por-fases)
6. [Especificações Técnicas](#-especificações-técnicas)
7. [Considerações de UX/UI](#-considerações-de-uxui)
8. [Segurança e Autenticação](#-segurança-e-autenticação)
9. [Métricas e KPIs](#-métricas-e-kpis)
10. [Riscos e Mitigações](#-riscos-e-mitigações)

---

## 🎯 Visão Geral

### Contexto do Projeto

A plataforma **Zenit** atualmente possui um módulo de **Biblioteca** que gerencia livros e filmes de forma unificada. O objetivo desta iniciativa é:

1. **Reestruturar a Biblioteca** para separar conteúdos de mídia (livros/filmes) de conteúdos de jogos
2. **Implementar Integração com APIs de Jogos** (Steam, Xbox, PlayStation)
3. **Criar Sistema de Gamificação** completo com mecânicas de recompensa
4. **Preparar Arquitetura Social** para compartilhamento e interações entre usuários

### Valor para o Usuário

- **Centralização**: Único local para gerenciar todo tipo de mídia consumida
- **Automação**: Importação automática de dados de plataformas de jogos
- **Motivação**: Sistema de pontos e recompensas para engajar usuários
- **Social**: Compartilhamento de conquistas e competição saudável
- **Insights**: Estatísticas detalhadas sobre hábitos de consumo de mídia

---

## 🔍 Contexto Atual

### Estrutura Existente

**Banco de Dados** ([schema.prisma](../prisma/schema.prisma))

```prisma
enum TipoMidia {
  LIVRO
  FILME
}

enum StatusLeitura {
  PROXIMO
  EM_ANDAMENTO
  PAUSADO
  CONCLUIDO
}

model Midia {
  id                    String         @id @default(cuid())
  tipo                  TipoMidia
  titulo                String
  capa                  String?
  cor                   String         @default("#8B5CF6")

  // Campos específicos de livro
  autor                 String?
  editora               String?
  genero                String?
  fonte                 FonteLivro?

  // Campos específicos de filme
  diretor               String?
  duracao               Int?
  anoLancamento         Int?

  // Campos comuns
  idioma                String?
  status                StatusLeitura  @default(PROXIMO)
  nota                  Int?
  dataInicio            DateTime?
  dataConclusao         DateTime?

  userId                String
  user                  User           @relation(fields: [userId], references: [id])
  citacoes              Citacao[]

  @@map("midias")
}
```

### Pontos Fortes

✅ Sistema de avaliação com estrelas
✅ Sistema de citações implementado
✅ Geração de resenhas com IA (Google Gemini)
✅ Compartilhamento social com cards visuais
✅ Busca de capas por API

### Limitações Identificadas

❌ Não suporta jogos como tipo de mídia
❌ Sem integração com plataformas de jogos
❌ Sem sistema de conquistas/achievements
❌ Sem sistema de gamificação
❌ Sem mecânicas sociais avançadas
❌ Sem economia interna (pontos/moedas)

---

## 🎯 Objetivos Estratégicos

### Objetivos de Negócio

1. **Aumentar Engajamento**: Sistema de gamificação para aumentar retenção em 40%
2. **Diferenciar Produto**: Única plataforma que unifica todos os tipos de mídia
3. **Monetização**: Base para features Premium (integrações, loja de itens)
4. **Viralidade**: Recursos sociais para crescimento orgânico
5. **Dados Valiosos**: Insights sobre comportamento de consumo de mídia

### Objetivos Técnicos

1. **Escalabilidade**: Arquitetura que suporte múltiplos tipos de mídia
2. **Extensibilidade**: Fácil adicionar novos tipos de mídia no futuro
3. **Performance**: APIs otimizadas para grandes volumes de dados
4. **Segurança**: OAuth 2.0 para todas integrações externas
5. **Manutenibilidade**: Código limpo e bem documentado

---

## 🗄️ Arquitetura de Dados

### Modelagem do Banco de Dados

#### 1. Extensão do Enum TipoMidia

```prisma
enum TipoMidia {
  LIVRO
  FILME
  JOGO      // Novo
}
```

#### 2. Novo Enum para Status de Jogos

```prisma
enum StatusJogo {
  NAO_INICIADO
  JOGANDO
  PAUSADO
  CONCLUIDO
  PLATINADO         // 100% de conquistas
  ABANDONADO
}
```

#### 3. Novo Enum para Plataformas de Jogos

```prisma
enum PlataformaJogo {
  STEAM
  XBOX
  PLAYSTATION
  NINTENDO_SWITCH
  EPIC_GAMES
  GOG
  OUTRO
}
```

#### 4. Modelo Midia Estendido

```prisma
model Midia {
  id                    String         @id @default(cuid())
  tipo                  TipoMidia
  titulo                String
  capa                  String?
  cor                   String         @default("#8B5CF6")

  // ==========================================
  // CAMPOS ESPECÍFICOS DE LIVRO
  // ==========================================
  autor                 String?
  editora               String?
  genero                String?
  fonte                 FonteLivro?

  // ==========================================
  // CAMPOS ESPECÍFICOS DE FILME
  // ==========================================
  diretor               String?
  duracao               Int?           // em minutos
  anoLancamento         Int?

  // ==========================================
  // CAMPOS ESPECÍFICOS DE JOGO
  // ==========================================
  desenvolvedora        String?
  publicadora           String?
  plataforma            PlataformaJogo?
  generoJogo            String?        // RPG, FPS, etc
  statusJogo            StatusJogo?

  // Estatísticas de jogo
  horasJogadas          Int?           // em horas
  conquistas            Json?          // { total: 50, desbloqueadas: 45 }
  porcentagemConclusao  Int?           // 0-100

  // Metadados de integração
  idExterno             String?        // ID na plataforma externa (Steam, etc)
  plataformaOrigem      PlataformaJogo?
  ultimaSincronizacao   DateTime?

  // ==========================================
  // CAMPOS COMUNS
  // ==========================================
  idioma                String?
  status                StatusLeitura  @default(PROXIMO)
  nota                  Int?           // 1-5 estrelas
  dataInicio            DateTime?
  dataConclusao         DateTime?

  // Resenha gerada por IA
  resenhaGeradaIA       String?        @db.Text

  // Reflexões e aprendizados
  impressoesIniciais    String?        @db.Text
  principaisAprendizados String?       @db.Text
  trechosMemoraveis     String?        @db.Text
  reflexao              String?        @db.Text
  aprendizadosPraticos  String?        @db.Text
  consideracoesFinais   String?        @db.Text

  userId                String
  user                  User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  citacoes              Citacao[]

  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  @@map("midias")
  @@index([userId, tipo, status])
  @@index([userId, tipo, statusJogo])
  @@index([idExterno, plataformaOrigem])
}
```

#### 5. Nova Tabela: IntegracaoPlataforma

```prisma
model IntegracaoPlataforma {
  id                String          @id @default(cuid())
  userId            String
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  plataforma        PlataformaJogo
  usuarioExterno    String?         // Username na plataforma
  idExterno         String?         // User ID na plataforma

  // OAuth Tokens
  accessToken       String?         @db.Text
  refreshToken      String?         @db.Text
  tokenExpiraEm     DateTime?

  // Configurações
  sincronizacaoAuto Boolean         @default(true)
  importarConquistas Boolean        @default(true)

  // Status
  ativo             Boolean         @default(true)
  ultimaSincronizacao DateTime?

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@unique([userId, plataforma])
  @@map("integracoes_plataforma")
  @@index([userId, plataforma])
}
```

#### 6. Sistema de Gamificação

```prisma
// ==========================================
// SISTEMA DE PONTOS E XP
// ==========================================

enum TipoAcao {
  // Ações de biblioteca
  ADICIONAR_LIVRO
  ADICIONAR_FILME
  ADICIONAR_JOGO
  CONCLUIR_LIVRO
  CONCLUIR_FILME
  CONCLUIR_JOGO
  ADICIONAR_CITACAO
  ADICIONAR_RESENHA
  PLATINAR_JOGO

  // Ações financeiras
  ADICIONAR_TRANSACAO
  CONCLUIR_OBJETIVO

  // Ações de agenda
  CONCLUIR_COMPROMISSO

  // Ações sociais
  COMPARTILHAR_PERFIL
  ADICIONAR_AMIGO

  // Ações de engajamento
  STREAK_7_DIAS
  STREAK_30_DIAS
  PRIMEIRA_SINCRONIZACAO
  PRIMEIRO_PREMIUM
}

model ConfiguracaoPontos {
  id                String          @id @default(cuid())
  acao              TipoAcao        @unique
  pontosGanhos      Int             // Pontos que o usuário ganha
  xpGanho           Int             // XP que o usuário ganha
  descricao         String?

  ativo             Boolean         @default(true)

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@map("configuracoes_pontos")
  @@index([acao])
}

model HistoricoPontos {
  id                String          @id @default(cuid())
  userId            String
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  acao              TipoAcao
  pontosGanhos      Int
  xpGanho           Int

  // Contexto
  descricao         String?
  metadados         Json?           // Informações adicionais sobre a ação

  createdAt         DateTime        @default(now())

  @@map("historico_pontos")
  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, acao])
}

// ==========================================
// SISTEMA DE NÍVEIS
// ==========================================

model Nivel {
  id                String          @id @default(cuid())
  numero            Int             @unique
  nome              String          // "Iniciante", "Explorador", "Mestre"
  xpNecessario      Int             // XP total necessário para alcançar

  // Recompensas desbloqueadas neste nível
  recompensas       String?         @db.Text // JSON com itens desbloqueados

  // Badges especiais
  badgeIcone        String?
  badgeCor          String?

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@map("niveis")
  @@index([numero])
  @@index([xpNecessario])
}

// ==========================================
// LOJA DE ITENS COSMÉTICOS
// ==========================================

enum TipoItem {
  BANNER
  FOTO_PERFIL
  EFEITO_PERFIL
  BADGE
  TEMA_CORES
  TITULO
}

enum RaridadeItem {
  COMUM
  INCOMUM
  RARO
  EPICO
  LENDARIO
}

model ItemLoja {
  id                String          @id @default(cuid())
  nome              String
  descricao         String?
  tipo              TipoItem
  raridade          RaridadeItem    @default(COMUM)

  // Custo
  precoEmPontos     Int
  nivelMinimo       Int?            // Nível mínimo para comprar

  // Recursos visuais
  imagemUrl         String?
  previewUrl        String?
  corPrimaria       String?
  corSecundaria     String?

  // Disponibilidade
  disponivel        Boolean         @default(true)
  limitado          Boolean         @default(false) // Item de tempo limitado
  dataInicio        DateTime?
  dataFim           DateTime?

  // Metadados
  tags              String[]        // ["natal", "premium", etc]
  ordemExibicao     Int             @default(0)

  compras           CompraItem[]

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@map("itens_loja")
  @@index([tipo, disponivel])
  @@index([raridade, disponivel])
  @@index([ordemExibicao])
}

model CompraItem {
  id                String          @id @default(cuid())
  userId            String
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  itemId            String
  item              ItemLoja        @relation(fields: [itemId], references: [id], onDelete: Restrict)

  precoEmPontos     Int             // Preço no momento da compra

  // Status
  equipado          Boolean         @default(false) // Se está sendo usado

  createdAt         DateTime        @default(now())

  @@map("compras_item")
  @@unique([userId, itemId])
  @@index([userId, equipado])
  @@index([itemId])
}

// ==========================================
// PERFIL DO USUÁRIO ESTENDIDO
// ==========================================

model PerfilUsuario {
  id                String          @id @default(cuid())
  userId            String          @unique
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Sistema de progressão
  pontosTotal       Int             @default(0)
  xpTotal           Int             @default(0)
  nivelAtual        Int             @default(1)
  xpProximoNivel    Int             @default(100)

  // Personalização
  bannerAtual       String?
  fotoPerfilCustom  String?
  tituloExibicao    String?
  corTema           String?

  // Estatísticas gerais
  livrosConcluidos  Int             @default(0)
  filmesConcluidos  Int             @default(0)
  jogosConcluidos   Int             @default(0)
  jogosPlatinados   Int             @default(0)

  // Streaks
  streakAtual       Int             @default(0) // Dias consecutivos
  maiorStreak       Int             @default(0)
  ultimaAtividade   DateTime?

  // Social
  perfilPublico     Boolean         @default(false)
  urlCustomizada    String?         @unique // ex: zenit.app/@username
  bio               String?         @db.Text

  // Estatísticas de tempo
  totalHorasJogadas Int             @default(0)
  totalLivrosLidos  Int             @default(0)

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@map("perfil_usuario")
  @@index([userId])
  @@index([nivelAtual])
  @@index([pontosTotal])
}

// ==========================================
// SISTEMA SOCIAL (Preparação)
// ==========================================

enum StatusAmizade {
  PENDENTE
  ACEITO
  BLOQUEADO
}

model Amizade {
  id                String          @id @default(cuid())

  usuarioId         String
  usuario           User            @relation("AmizadeUsuario", fields: [usuarioId], references: [id], onDelete: Cascade)

  amigoId           String
  amigo             User            @relation("AmizadeAmigo", fields: [amigoId], references: [id], onDelete: Cascade)

  status            StatusAmizade   @default(PENDENTE)

  // Quem enviou o pedido
  solicitanteId     String

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@unique([usuarioId, amigoId])
  @@map("amizades")
  @@index([usuarioId, status])
  @@index([amigoId, status])
}
```

#### 7. Atualização do Model User

```prisma
model User {
  // ... campos existentes ...

  // Novas relações
  integracoesPlataforma  IntegracaoPlataforma[]
  historicoPontos        HistoricoPontos[]
  comprasItem            CompraItem[]
  perfilUsuario          PerfilUsuario?
  amizades               Amizade[]              @relation("AmizadeUsuario")
  amigoDe                Amizade[]              @relation("AmizadeAmigo")

  @@map("users")
}
```

### Diagrama de Relacionamentos

```
┌─────────────────┐
│     User        │
└────────┬────────┘
         │
         ├──────────────────────┬──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐    ┌──────────────────┐  ┌──────────────────┐
│  PerfilUsuario  │    │ IntegracaoPlat.  │  │  HistoricoPontos │
│                 │    │                  │  │                  │
│ - pontosTotal   │    │ - plataforma     │  │ - acao           │
│ - xpTotal       │    │ - accessToken    │  │ - pontosGanhos   │
│ - nivelAtual    │    │ - refreshToken   │  │ - xpGanho        │
└─────────────────┘    └──────────────────┘  └──────────────────┘
         │
         │
         ▼
┌─────────────────┐
│   CompraItem    │◄───────┐
│                 │        │
│ - itemId        │        │
│ - equipado      │        │
└─────────────────┘        │
         │                 │
         │                 │
         ▼                 │
┌─────────────────┐        │
│    ItemLoja     │────────┘
│                 │
│ - tipo          │
│ - raridade      │
│ - precoEmPontos │
└─────────────────┘

┌─────────────────┐
│      Midia      │
│                 │
│ - tipo          │◄── LIVRO, FILME, JOGO
│ - statusJogo    │
│ - horasJogadas  │
│ - conquistas    │
└─────────────────┘
```

---

## 🗓️ Roadmap por Fases

### 📌 Fase 1: Fundação e Reestruturação (Curto Prazo - 4-6 semanas)

#### Sprint 1.1: Modelagem e Migração de Dados (2 semanas)

**Objetivo**: Preparar banco de dados para suportar jogos e gamificação

**Entregáveis**:
- ✅ Criar migração Prisma com novos models
- ✅ Adicionar enums (StatusJogo, PlataformaJogo, TipoItem, etc)
- ✅ Estender model Midia com campos de jogo
- ✅ Criar models de gamificação (PerfilUsuario, ItemLoja, etc)
- ✅ Criar seeds de dados iniciais (configurações de pontos, níveis)
- ✅ Testes de migração em ambiente de staging

**Critérios de Aceite**:
- [ ] Migração roda sem erros
- [ ] Dados existentes de livros/filmes preservados
- [ ] Novos campos aceitam valores nulos para compatibilidade
- [ ] Índices criados para otimização de queries

**Stack Técnica**:
- Prisma ORM
- PostgreSQL
- TypeScript

---

#### Sprint 1.2: API Base de Jogos (2 semanas)

**Objetivo**: Criar endpoints CRUD para jogos

**Entregáveis**:
- ✅ `POST /api/v1/biblioteca/jogos` - Adicionar jogo manualmente
- ✅ `GET /api/v1/biblioteca/jogos` - Listar jogos do usuário
- ✅ `GET /api/v1/biblioteca/jogos/:id` - Detalhes de um jogo
- ✅ `PUT /api/v1/biblioteca/jogos/:id` - Atualizar jogo
- ✅ `DELETE /api/v1/biblioteca/jogos/:id` - Excluir jogo
- ✅ Validação de dados com Zod
- ✅ Tratamento de erros padronizado
- ✅ Documentação de API

**Exemplo de Payload**:

```typescript
// POST /api/v1/biblioteca/jogos
{
  "titulo": "The Witcher 3: Wild Hunt",
  "desenvolvedora": "CD Projekt Red",
  "publicadora": "CD Projekt",
  "plataforma": "STEAM",
  "generoJogo": "RPG",
  "statusJogo": "CONCLUIDO",
  "horasJogadas": 120,
  "nota": 5,
  "dataInicio": "2025-06-01",
  "dataConclusao": "2025-09-15",
  "capa": "https://cdn.cloudflare.steamstatic.com/...",
  "conquistas": {
    "total": 78,
    "desbloqueadas": 78
  },
  "porcentagemConclusao": 100
}
```

**Critérios de Aceite**:
- [ ] Todos endpoints retornam status HTTP corretos
- [ ] Validação impede dados inválidos
- [ ] Respostas seguem padrão REST
- [ ] Logs de auditoria criados

---

#### Sprint 1.3: Frontend - Separação de Seções (2 semanas)

**Objetivo**: Reestruturar UI da biblioteca

**Entregáveis**:
- ✅ Nova página `/dashboard/biblioteca` com tabs:
  - Tab "Livros"
  - Tab "Filmes"
  - Tab "Jogos" (novo)
- ✅ Componente `GameCard.tsx` para exibir jogos
- ✅ Modal `NovoJogoModal.tsx` para adicionar jogos
- ✅ Filtros por plataforma, status e gênero
- ✅ Badges especiais para jogos "Platinados"
- ✅ Estatísticas por tipo de mídia no header

**Design System**:
```typescript
// GameCard.tsx
interface GameCardProps {
  jogo: Midia;
  onClick: () => void;
}

// Visual:
// - Capa do jogo (16:9)
// - Badge de plataforma (Steam, Xbox, etc)
// - Título e desenvolvedora
// - Horas jogadas e % de conclusão
// - Badge dourado se platinado
```

**Critérios de Aceite**:
- [ ] Responsivo em mobile e desktop
- [ ] Transições suaves entre tabs
- [ ] Loading states implementados
- [ ] Acessibilidade (ARIA labels)

---

### 📌 Fase 2: Integração com Steam (Médio Prazo - 6-8 semanas)

#### Sprint 2.1: Setup de Integração Steam (3 semanas)

**Objetivo**: Conectar com Steam Web API

**Pré-requisitos**:
1. Criar conta Steam Developer
2. Obter API Key
3. Configurar OAuth 2.0 (Steam OpenID)

**Entregáveis**:
- ✅ Configurar variáveis de ambiente:
  ```env
  STEAM_API_KEY=sua_api_key
  STEAM_WEB_API_URL=https://api.steampowered.com
  STEAM_OPENID_URL=https://steamcommunity.com/openid/login
  ```
- ✅ Implementar autenticação Steam OpenID
- ✅ Criar service `SteamService.ts`:
  - `getPlayerSummary(steamId)` - Dados do jogador
  - `getOwnedGames(steamId)` - Lista de jogos
  - `getPlayerAchievements(steamId, appId)` - Conquistas
  - `getGameSchema(appId)` - Metadados do jogo
- ✅ Criar model `IntegracaoPlataforma` no DB
- ✅ Endpoint `POST /api/v1/biblioteca/integracoes/steam/connect`
- ✅ Endpoint `GET /api/v1/biblioteca/integracoes/steam/status`

**Fluxo de Autenticação**:
```
1. Usuário clica "Conectar Steam"
2. Redireciona para Steam OpenID
3. Usuário autoriza no Steam
4. Steam redireciona de volta com token
5. Backend valida token e salva integração
6. Frontend mostra "Conectado ✓"
```

**Segurança**:
- ✅ Tokens armazenados criptografados
- ✅ Rate limiting nas APIs
- ✅ Validação de callback URL
- ✅ CSRF protection

**Critérios de Aceite**:
- [ ] Autenticação funciona 100%
- [ ] Tokens persistem no banco
- [ ] Retry automático em caso de falha
- [ ] Logs detalhados de integração

---

#### Sprint 2.2: Importação de Biblioteca Steam (3 semanas)

**Objetivo**: Importar jogos automaticamente

**Entregáveis**:
- ✅ Endpoint `POST /api/v1/biblioteca/integracoes/steam/sincronizar`
  - Importa todos os jogos do usuário
  - Busca metadados (capa, descrição, etc)
  - Calcula % de conclusão de conquistas
  - Identifica jogos "platinados" (100%)
- ✅ Job de sincronização automática (cron job):
  ```typescript
  // Roda diariamente às 3h AM
  cron.schedule('0 3 * * *', async () => {
    await sincronizarTodasIntegracoes();
  });
  ```
- ✅ Componente `SteamSyncButton.tsx` no frontend
- ✅ Modal de progresso de importação
- ✅ Notificação de jogos novos importados

**Lógica de Sincronização**:
```typescript
async function sincronizarSteam(userId: string) {
  // 1. Buscar integração do usuário
  const integracao = await prisma.integracaoPlataforma.findUnique({
    where: { userId_plataforma: { userId, plataforma: 'STEAM' } }
  });

  // 2. Buscar jogos do Steam
  const jogos = await steamService.getOwnedGames(integracao.idExterno);

  // 3. Para cada jogo
  for (const jogo of jogos) {
    // Verificar se já existe
    let midiaExistente = await prisma.midia.findFirst({
      where: {
        userId,
        idExterno: jogo.appid.toString(),
        plataformaOrigem: 'STEAM'
      }
    });

    if (midiaExistente) {
      // Atualizar dados
      await prisma.midia.update({
        where: { id: midiaExistente.id },
        data: {
          horasJogadas: Math.round(jogo.playtime_forever / 60),
          ultimaSincronizacao: new Date()
        }
      });
    } else {
      // Criar novo
      await prisma.midia.create({
        data: {
          tipo: 'JOGO',
          titulo: jogo.name,
          idExterno: jogo.appid.toString(),
          plataformaOrigem: 'STEAM',
          plataforma: 'STEAM',
          horasJogadas: Math.round(jogo.playtime_forever / 60),
          capa: `https://cdn.cloudflare.steamstatic.com/steam/apps/${jogo.appid}/library_600x900.jpg`,
          userId
        }
      });
    }

    // 4. Buscar conquistas
    const conquistas = await steamService.getPlayerAchievements(
      integracao.idExterno,
      jogo.appid
    );

    if (conquistas) {
      const total = conquistas.length;
      const desbloqueadas = conquistas.filter(c => c.achieved).length;
      const porcentagem = Math.round((desbloqueadas / total) * 100);

      await prisma.midia.update({
        where: { id: midiaExistente.id },
        data: {
          conquistas: { total, desbloqueadas },
          porcentagemConclusao: porcentagem,
          statusJogo: porcentagem === 100 ? 'PLATINADO' : 'JOGANDO'
        }
      });
    }
  }

  // 5. Atualizar última sincronização
  await prisma.integracaoPlataforma.update({
    where: { id: integracao.id },
    data: { ultimaSincronizacao: new Date() }
  });
}
```

**Tratamento de Erros**:
- Rate limit do Steam (1 request/segundo)
- Jogos privados (não retornam dados)
- API fora do ar (retry com exponential backoff)

**Critérios de Aceite**:
- [ ] Importa 100% dos jogos públicos
- [ ] Não cria duplicatas
- [ ] Atualiza dados existentes
- [ ] Performance < 30s para 500 jogos
- [ ] Identifica corretamente jogos platinados

---

#### Sprint 2.3: UI de Integração Steam (2 semanas)

**Objetivo**: Interface amigável para integração

**Entregáveis**:
- ✅ Página `/dashboard/biblioteca/integracoes`
- ✅ Card de integração Steam com:
  - Status (Conectado/Desconectado)
  - Avatar e username do Steam
  - Última sincronização
  - Botão "Conectar" ou "Sincronizar"
  - Botão "Desconectar"
- ✅ Modal de progresso com:
  - Barra de progresso
  - "Importando X de Y jogos..."
  - Estimativa de tempo restante
- ✅ Toast notifications para:
  - Conexão bem-sucedida
  - Sincronização completa
  - Novos jogos encontrados
  - Erros (com link para suporte)

**UX Considerations**:
- Loading skeleton durante importação
- Animação de "check" quando concluído
- Tooltip explicativo sobre cada integração
- Link para "Como conectar minha conta Steam?"

**Critérios de Aceite**:
- [ ] Fluxo completo sem erros
- [ ] Feedback visual em todas etapas
- [ ] Responsivo em todos dispositivos
- [ ] Acessível (WCAG 2.1 AA)

---

### 📌 Fase 3: Sistema de Gamificação (Médio Prazo - 6-8 semanas)

#### Sprint 3.1: Core da Gamificação (3 semanas)

**Objetivo**: Implementar sistema de pontos e XP

**Entregáveis**:
- ✅ Seed de configurações de pontos:
  ```typescript
  const ACOES_PONTOS = [
    { acao: 'ADICIONAR_LIVRO', pontos: 10, xp: 5 },
    { acao: 'ADICIONAR_FILME', pontos: 10, xp: 5 },
    { acao: 'ADICIONAR_JOGO', pontos: 10, xp: 5 },
    { acao: 'CONCLUIR_LIVRO', pontos: 50, xp: 25 },
    { acao: 'CONCLUIR_FILME', pontos: 30, xp: 15 },
    { acao: 'CONCLUIR_JOGO', pontos: 100, xp: 50 },
    { acao: 'PLATINAR_JOGO', pontos: 500, xp: 200 },
    { acao: 'ADICIONAR_CITACAO', pontos: 5, xp: 2 },
    { acao: 'ADICIONAR_RESENHA', pontos: 20, xp: 10 },
    { acao: 'PRIMEIRA_SINCRONIZACAO', pontos: 100, xp: 50 },
    { acao: 'STREAK_7_DIAS', pontos: 50, xp: 25 },
    { acao: 'STREAK_30_DIAS', pontos: 200, xp: 100 },
  ];
  ```
- ✅ Service `GamificacaoService.ts`:
  ```typescript
  class GamificacaoService {
    async concederPontos(userId: string, acao: TipoAcao, metadados?: any) {
      // 1. Buscar configuração da ação
      const config = await prisma.configuracaoPontos.findUnique({ acao });

      // 2. Criar registro no histórico
      await prisma.historicoPontos.create({
        data: {
          userId,
          acao,
          pontosGanhos: config.pontosGanhos,
          xpGanho: config.xpGanho,
          metadados
        }
      });

      // 3. Atualizar perfil do usuário
      const perfil = await prisma.perfilUsuario.findUnique({ where: { userId } });
      const novoXp = perfil.xpTotal + config.xpGanho;
      const novoPontos = perfil.pontosTotal + config.pontosGanhos;

      // 4. Calcular novo nível
      const novoNivel = await this.calcularNivel(novoXp);

      // 5. Verificar se subiu de nível
      const subiuDeNivel = novoNivel > perfil.nivelAtual;

      await prisma.perfilUsuario.update({
        where: { userId },
        data: {
          xpTotal: novoXp,
          pontosTotal: novoPontos,
          nivelAtual: novoNivel,
          xpProximoNivel: await this.calcularXpProximoNivel(novoNivel)
        }
      });

      // 6. Se subiu de nível, desbloquear recompensas
      if (subiuDeNivel) {
        await this.desbloquearRecompensasNivel(userId, novoNivel);
      }

      return { novoXp, novoPontos, novoNivel, subiuDeNivel };
    }

    async calcularNivel(xpTotal: number): Promise<number> {
      // Fórmula: Nível = sqrt(xpTotal / 100)
      // Nível 1: 0-100 XP
      // Nível 2: 100-400 XP
      // Nível 3: 400-900 XP
      // Nível 10: 10,000 XP
      return Math.floor(Math.sqrt(xpTotal / 100)) + 1;
    }

    async calcularXpProximoNivel(nivelAtual: number): Promise<number> {
      // XP necessário para o próximo nível
      return Math.pow(nivelAtual, 2) * 100;
    }
  }
  ```
- ✅ Integrar service em todos endpoints relevantes:
  - Após criar livro/filme/jogo
  - Após concluir mídia
  - Após adicionar citação
  - Após gerar resenha
  - Após conectar integração

**Exemplo de Integração**:
```typescript
// Em POST /api/v1/biblioteca/jogos
const jogo = await prisma.midia.create({ data: jogoData });

// Conceder pontos
await gamificacaoService.concederPontos(
  userId,
  'ADICIONAR_JOGO',
  { midiaId: jogo.id, titulo: jogo.titulo }
);

// Se for jogo platinado, conceder bônus
if (jogo.porcentagemConclusao === 100) {
  await gamificacaoService.concederPontos(
    userId,
    'PLATINAR_JOGO',
    { midiaId: jogo.id, titulo: jogo.titulo }
  );
}
```

**Critérios de Aceite**:
- [ ] Pontos concedidos corretamente
- [ ] XP calculado com precisão
- [ ] Nível atualiza automaticamente
- [ ] Histórico registrado para auditoria

---

#### Sprint 3.2: Sistema de Níveis (2 semanas)

**Objetivo**: Criar progressão por níveis

**Entregáveis**:
- ✅ Seed de 50 níveis com nomes criativos:
  ```typescript
  const NIVEIS = [
    { numero: 1, nome: 'Iniciante', xpNecessario: 0 },
    { numero: 2, nome: 'Aprendiz', xpNecessario: 100 },
    { numero: 3, nome: 'Explorador', xpNecessario: 400 },
    { numero: 5, nome: 'Aventureiro', xpNecessario: 2500 },
    { numero: 10, nome: 'Veterano', xpNecessario: 10000 },
    { numero: 15, nome: 'Especialista', xpNecessario: 22500 },
    { numero: 20, nome: 'Mestre', xpNecessario: 40000 },
    { numero: 30, nome: 'Lenda', xpNecessario: 90000 },
    { numero: 50, nome: 'Imortal', xpNecessario: 250000 },
  ];
  ```
- ✅ Componente `LevelDisplay.tsx`:
  - Badge com nível atual
  - Barra de progresso para próximo nível
  - Tooltip com nome do nível
- ✅ Página `/dashboard/perfil/nivel`:
  - Nível atual destacado
  - Lista de todos os níveis
  - Recompensas de cada nível
  - Progresso visual
- ✅ Notificação ao subir de nível:
  - Modal comemorativo com confetti
  - "Parabéns! Você alcançou nível X"
  - Lista de recompensas desbloqueadas

**Critérios de Aceite**:
- [ ] Cálculo de nível correto
- [ ] Progressão visual clara
- [ ] Animações suaves
- [ ] Feedback imediato ao subir nível

---

#### Sprint 3.3: Loja de Itens (3 semanas)

**Objetivo**: Criar marketplace de itens cosméticos

**Entregáveis**:
- ✅ Seed de itens iniciais (50+ itens):
  ```typescript
  const ITENS_INICIAIS = [
    // Banners
    { nome: 'Banner Galáxia', tipo: 'BANNER', raridade: 'COMUM', precoEmPontos: 100 },
    { nome: 'Banner Oceano', tipo: 'BANNER', raridade: 'COMUM', precoEmPontos: 100 },
    { nome: 'Banner Fogo', tipo: 'BANNER', raridade: 'INCOMUM', precoEmPontos: 250 },
    { nome: 'Banner Lendário', tipo: 'BANNER', raridade: 'LENDARIO', precoEmPontos: 5000, nivelMinimo: 20 },

    // Fotos de Perfil
    { nome: 'Avatar Gato', tipo: 'FOTO_PERFIL', raridade: 'COMUM', precoEmPontos: 50 },
    { nome: 'Avatar Robô', tipo: 'FOTO_PERFIL', raridade: 'RARO', precoEmPontos: 500 },

    // Efeitos
    { nome: 'Efeito Brilho', tipo: 'EFEITO_PERFIL', raridade: 'RARO', precoEmPontos: 1000 },
    { nome: 'Efeito Partículas', tipo: 'EFEITO_PERFIL', raridade: 'EPICO', precoEmPontos: 2500 },

    // Badges
    { nome: 'Badge Leitor', tipo: 'BADGE', raridade: 'COMUM', precoEmPontos: 200 },
    { nome: 'Badge Gamer', tipo: 'BADGE', raridade: 'INCOMUM', precoEmPontos: 300 },

    // Temas de Cores
    { nome: 'Tema Ciberpunk', tipo: 'TEMA_CORES', raridade: 'EPICO', precoEmPontos: 3000, nivelMinimo: 15 },
  ];
  ```
- ✅ Página `/dashboard/loja`:
  - Grid de itens
  - Filtros por tipo e raridade
  - Preview ao hover
  - Botão "Comprar" com preço
  - Indicador de saldo de pontos
  - Label "Bloqueado" para itens de nível alto
- ✅ Modal de confirmação de compra:
  - Preview do item
  - Preço em destaque
  - Botão "Confirmar Compra"
  - Aviso se não tiver pontos suficientes
- ✅ Endpoint `POST /api/v1/gamificacao/loja/comprar`:
  ```typescript
  async function comprarItem(userId: string, itemId: string) {
    // 1. Verificar se item existe e está disponível
    const item = await prisma.itemLoja.findUnique({ where: { id: itemId } });
    if (!item || !item.disponivel) throw new Error('Item indisponível');

    // 2. Verificar se usuário tem pontos suficientes
    const perfil = await prisma.perfilUsuario.findUnique({ where: { userId } });
    if (perfil.pontosTotal < item.precoEmPontos) {
      throw new Error('Pontos insuficientes');
    }

    // 3. Verificar nível mínimo
    if (item.nivelMinimo && perfil.nivelAtual < item.nivelMinimo) {
      throw new Error(`Nível mínimo: ${item.nivelMinimo}`);
    }

    // 4. Verificar se já possui o item
    const jaComprado = await prisma.compraItem.findUnique({
      where: { userId_itemId: { userId, itemId } }
    });
    if (jaComprado) throw new Error('Você já possui este item');

    // 5. Realizar compra
    await prisma.compraItem.create({
      data: { userId, itemId, precoEmPontos: item.precoEmPontos }
    });

    // 6. Debitar pontos
    await prisma.perfilUsuario.update({
      where: { userId },
      data: { pontosTotal: perfil.pontosTotal - item.precoEmPontos }
    });

    return { sucesso: true, item };
  }
  ```
- ✅ Sistema de "Equipar" itens:
  - Endpoint `PUT /api/v1/gamificacao/loja/equipar/:itemId`
  - Apenas 1 item de cada tipo pode estar equipado
  - Atualiza perfil visual do usuário

**Sistema de Raridade**:
- **Comum** (Branco): Itens básicos, baratos
- **Incomum** (Verde): Itens interessantes
- **Raro** (Azul): Itens especiais
- **Épico** (Roxo): Itens muito desejados
- **Lendário** (Dourado): Itens únicos, caros

**Critérios de Aceite**:
- [ ] Loja carrega em < 1s
- [ ] Filtros funcionam perfeitamente
- [ ] Compra atualiza saldo instantaneamente
- [ ] Itens equipados aplicam-se ao perfil
- [ ] Não permite compra duplicada

---

### 📌 Fase 4: Expansão e Recursos Sociais (Longo Prazo - 8-12 semanas)

#### Sprint 4.1: Integração Xbox (4 semanas)

**Objetivo**: Adicionar suporte para Xbox Live

**Pré-requisitos**:
- Criar app no Azure AD
- Obter Client ID e Secret
- Configurar redirect URI

**Entregáveis**:
- ✅ Autenticação OAuth 2.0 com Microsoft
- ✅ Service `XboxService.ts`:
  - `getProfile(xuid)` - Perfil do jogador
  - `getGames(xuid)` - Jogos da biblioteca
  - `getAchievements(xuid, titleId)` - Conquistas
- ✅ Sincronização similar à Steam
- ✅ UI de integração Xbox

**Desafios**:
- API do Xbox é mais complexa que Steam
- Requer múltiplas chamadas para dados completos
- Rate limiting mais agressivo

---

#### Sprint 4.2: Integração PlayStation (4 semanas)

**Objetivo**: Adicionar suporte para PlayStation Network

**Pré-requisitos**:
- API não-oficial (ou aguardar API oficial)
- Alternativa: Import manual com PSN profiles

**Entregáveis**:
- ✅ Integração com PSN Profiles (scraping)
- ✅ Importação de troféus
- ✅ Identificação automática de platinas
- ✅ UI de integração PlayStation

**Nota**: PlayStation não tem API pública oficial. Soluções:
1. Usar APIs não-oficiais (risco de quebrar)
2. Permitir import manual via CSV
3. Integração com sites terceiros (PSN Profiles)

---

#### Sprint 4.3: Perfil Público e Compartilhamento (4 semanas)

**Objetivo**: Permitir que usuários compartilhem seus perfis

**Entregáveis**:
- ✅ Configuração de privacidade:
  - Perfil público/privado
  - Escolher o que mostrar (jogos, livros, filmes)
- ✅ URL personalizada: `zenit.app/@username`
- ✅ Página pública `/perfil/@username`:
  - Banner customizado
  - Avatar e nível
  - Badges conquistadas
  - Estatísticas públicas (jogos platinados, livros lidos)
  - Grid de jogos/livros/filmes
- ✅ Botão "Compartilhar Perfil":
  - Gera link
  - Opção de compartilhar no Twitter, WhatsApp, etc
- ✅ Open Graph tags para preview bonito

**SEO e Open Graph**:
```html
<meta property="og:title" content="Perfil de @username no Zenit" />
<meta property="og:description" content="Nível 25 • 150 jogos • 50 livros" />
<meta property="og:image" content="https://zenit.app/api/og/@username" />
```

---

#### Sprint 4.4: Sistema de Amigos (4 semanas)

**Objetivo**: Adicionar rede social básica

**Entregáveis**:
- ✅ Endpoint `POST /api/v1/social/amigos/adicionar`
- ✅ Endpoint `PUT /api/v1/social/amigos/aceitar/:id`
- ✅ Endpoint `DELETE /api/v1/social/amigos/remover/:id`
- ✅ Endpoint `GET /api/v1/social/amigos` - Lista de amigos
- ✅ Página `/dashboard/amigos`:
  - Lista de amigos
  - Solicitações pendentes
  - Buscar usuários
- ✅ Feed de atividades dos amigos (opcional):
  - "João concluiu The Witcher 3"
  - "Maria subiu para nível 10"
  - "Pedro platinou God of War"

**Fluxo de Amizade**:
```
1. Usuário A busca Usuário B
2. Usuário A envia solicitação
3. Usuário B recebe notificação
4. Usuário B aceita ou recusa
5. Se aceito, ambos viram no feed do outro
```

---

### 📌 Fase 5: Recursos Premium e Monetização (Longo Prazo - Contínuo)

#### Features Premium

**Plano PREMIUM incluirá**:
- ✅ Sincronização automática ilimitada (FREE: 1x/dia)
- ✅ Acesso a itens exclusivos da loja
- ✅ Bônus de 50% em XP e pontos
- ✅ Badge "Premium" no perfil
- ✅ Sem limites de biblioteca (FREE: 100 itens)
- ✅ Analytics avançados (tempo jogado, gráficos)
- ✅ Export de dados (CSV, PDF)
- ✅ Suporte prioritário

**Implementação**:
```prisma
enum RecursoPremium {
  // Existentes
  GERAR_RESENHA_IA
  SINCRONIZAR_GOOGLE_CALENDAR

  // Novos
  SINCRONIZACAO_AUTO_JOGOS
  ITENS_EXCLUSIVOS_LOJA
  BONUS_XP_PONTOS
  BIBLIOTECA_ILIMITADA
  ANALYTICS_AVANCADOS
  EXPORT_DADOS
}
```

**Verificação de Acesso**:
```typescript
// Em endpoints relevantes
const { temAcesso } = verificarAcessoRecurso(
  user.plano,
  user.planoExpiraEm,
  RecursoPremium.SINCRONIZACAO_AUTO_JOGOS
);

if (!temAcesso) {
  return res.status(403).json({
    error: 'Recurso Premium',
    upgrade: '/premium'
  });
}
```

---

## 🎨 Considerações de UX/UI

### Design de Cards de Jogo

**Informações Exibidas**:
- Capa do jogo (destaque visual)
- Plataforma (badge Steam/Xbox/PS)
- Título e desenvolvedora
- Status (Jogando, Concluído, Platinado)
- Horas jogadas (ícone relógio + número)
- % de conquistas com barra de progresso
- Badge dourado se platinado ✨

**Estados Visuais**:
```typescript
// Cores de status
const STATUS_COLORS = {
  NAO_INICIADO: 'zinc-600',
  JOGANDO: 'blue-500',
  PAUSADO: 'yellow-500',
  CONCLUIDO: 'green-500',
  PLATINADO: 'amber-500', // Dourado
  ABANDONADO: 'red-500'
};

// Badge de platina
{status === 'PLATINADO' && (
  <div className="absolute top-2 right-2">
    <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />
  </div>
)}
```

### Tela de Status de Jogos

**Filtros Disponíveis**:
- Todos os jogos
- Não iniciados
- Jogando atualmente
- Pausados
- Concluídos
- Platinados ⭐
- Abandonados

**Ordenação**:
- Alfabética (A-Z, Z-A)
- Mais jogados (horas)
- Mais recentes
- Melhor avaliados (nota)
- % de conclusão

### Sistema de Badges e Conquistas

**Badges Automáticas**:
- 🎮 **Gamer Casual**: 10 jogos concluídos
- 🏆 **Caçador de Troféus**: 5 jogos platinados
- 📚 **Bibliófilo**: 50 livros lidos
- 🎬 **Cinéfilo**: 100 filmes assistidos
- 🔥 **Dedicado**: Streak de 30 dias
- 💎 **Colecionador**: 500 mídias cadastradas
- ⚡ **Velocista**: Concluir 10 jogos em 1 mês

**UI de Badges**:
```tsx
<div className="grid grid-cols-4 gap-4">
  {badges.map(badge => (
    <div
      key={badge.id}
      className={cn(
        "flex flex-col items-center p-4 rounded-lg",
        badge.desbloqueado ? "bg-zinc-800" : "bg-zinc-900 opacity-50 grayscale"
      )}
    >
      <badge.icon className="w-12 h-12 mb-2" />
      <span className="text-sm font-medium">{badge.nome}</span>
      <span className="text-xs text-zinc-400">{badge.descricao}</span>
    </div>
  ))}
</div>
```

### Economia do Sistema

**Sistema Dual: XP + Pontos**

**XP (Experience Points)**:
- Serve para subir de nível
- Não pode ser gasto
- Representa progressão permanente
- Nunca diminui

**Pontos**:
- Moeda virtual gastável
- Usada na loja de itens
- Pode ser ganhada e gasta
- Saldo pode zerar

**Balanceamento**:
```typescript
// Progressão de Níveis (XP necessário)
const XP_POR_NIVEL = [
  0,      // Nível 1
  100,    // Nível 2
  400,    // Nível 3
  900,    // Nível 4
  1600,   // Nível 5
  2500,   // Nível 6
  // ... crescimento quadrático
];

// Preços na Loja (em pontos)
const PRECOS = {
  COMUM: 50-200,
  INCOMUM: 250-500,
  RARO: 600-1500,
  EPICO: 2000-4000,
  LENDARIO: 5000-10000
};

// Tempo estimado para comprar item Lendário:
// 10.000 pontos / 100 pontos por dia = 100 dias
// Isso mantém jogadores engajados por meses
```

---

## 🔒 Segurança e Autenticação

### OAuth 2.0 para Integrações

**Steam OpenID**:
```typescript
// Fluxo de autenticação
const steamAuthUrl = `https://steamcommunity.com/openid/login?${params}`;

// Validação do callback
async function validateSteamAuth(params: any): Promise<boolean> {
  const response = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    body: new URLSearchParams({
      'openid.mode': 'check_authentication',
      ...params
    })
  });

  const text = await response.text();
  return text.includes('is_valid:true');
}
```

**Xbox OAuth 2.0**:
```typescript
// Usando Microsoft Identity Platform
const msalConfig = {
  auth: {
    clientId: process.env.XBOX_CLIENT_ID!,
    authority: 'https://login.microsoftonline.com/consumers',
    redirectUri: `${process.env.NEXT_PUBLIC_URL}/api/v1/biblioteca/integracoes/xbox/callback`
  }
};

// Scopes necessários
const scopes = [
  'Xboxlive.signin',
  'Xboxlive.offline_access'
];
```

### Armazenamento Seguro de Tokens

**Criptografia**:
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

function encryptToken(token: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptToken(encryptedToken: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### Rate Limiting

**Proteção contra Abuse**:
```typescript
// Usando upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests por minuto
});

// Em cada endpoint
const identifier = `${userId}:${endpoint}`;
const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

if (!success) {
  return res.status(429).json({
    error: 'Too many requests',
    limit,
    remaining,
    reset
  });
}
```

### Validação de Dados

**Schemas Zod**:
```typescript
import { z } from 'zod';

const JogoSchema = z.object({
  titulo: z.string().min(1).max(200),
  desenvolvedora: z.string().optional(),
  plataforma: z.enum(['STEAM', 'XBOX', 'PLAYSTATION', 'NINTENDO_SWITCH', 'OUTRO']),
  statusJogo: z.enum(['NAO_INICIADO', 'JOGANDO', 'PAUSADO', 'CONCLUIDO', 'PLATINADO', 'ABANDONADO']),
  horasJogadas: z.number().int().min(0).optional(),
  nota: z.number().int().min(1).max(5).optional(),
  conquistas: z.object({
    total: z.number().int().min(0),
    desbloqueadas: z.number().int().min(0)
  }).optional()
});

// Uso em endpoints
const dados = JogoSchema.parse(req.body);
```

---

## 📊 Métricas e KPIs

### Métricas de Produto

**Engajamento**:
- DAU (Daily Active Users)
- WAU (Weekly Active Users)
- MAU (Monthly Active Users)
- Tempo médio na plataforma
- Taxa de retenção (D1, D7, D30)
- Streak médio de usuários

**Gamificação**:
- Média de pontos por usuário
- Distribuição de níveis
- Taxa de compra na loja (Conversão)
- Items mais populares
- Taxa de "subir de nível"

**Integrações**:
- % de usuários com Steam conectado
- % de usuários com Xbox conectado
- % de usuários com PlayStation conectado
- Média de jogos importados
- Taxa de sincronização automática

**Conteúdo**:
- Média de jogos por usuário
- Média de livros por usuário
- Média de filmes por usuário
- Taxa de conclusão de mídias
- % de jogos platinados

### Dashboards

**Admin Dashboard** (`/admin/metricas`):
```typescript
// Queries de exemplo
const metricas = await prisma.$queryRaw`
  SELECT
    COUNT(DISTINCT user_id) as usuarios_ativos,
    AVG(pontos_total) as media_pontos,
    AVG(nivel_atual) as media_nivel,
    COUNT(*) FILTER (WHERE tipo = 'JOGO') as total_jogos,
    COUNT(*) FILTER (WHERE status_jogo = 'PLATINADO') as jogos_platinados,
    AVG(horas_jogadas) FILTER (WHERE tipo = 'JOGO') as media_horas_jogadas
  FROM perfil_usuario
  JOIN midias ON midias.user_id = perfil_usuario.user_id
`;
```

**User Analytics** (Premium):
- Gráfico de progresso ao longo do tempo
- Distribuição de tempo por plataforma
- Top 10 jogos mais jogados
- Conquistas ao longo dos meses
- Comparação com amigos

---

## ⚠️ Riscos e Mitigações

### Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **API Steam indisponível** | Média | Alto | Cache de dados, retry com exponential backoff, fallback para import manual |
| **Rate limiting agressivo** | Alta | Médio | Implementar fila de jobs, processar em background, respeitar limites |
| **Mudanças nas APIs externas** | Média | Alto | Versionamento de integrações, testes automatizados, monitoramento 24/7 |
| **Performance com grandes volumes** | Baixa | Alto | Paginação, lazy loading, indexação de DB, cache Redis |
| **Segurança de tokens** | Baixa | Crítico | Criptografia AES-256, rotação de tokens, auditoria de acessos |
| **Fraude na economia interna** | Média | Alto | Validação server-side, logs de auditoria, detecção de anomalias |

### Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Baixa adoção de gamificação** | Média | Alto | A/B testing, ajuste de recompensas, pesquisa com usuários |
| **Balanceamento incorreto de pontos** | Alta | Médio | Análise de métricas, ajustes iterativos, feedback da comunidade |
| **Churn após novidade** | Média | Alto | Eventos sazonais, novos itens mensais, sistema de streaks |
| **Complexidade assusta usuários** | Baixa | Médio | Onboarding guiado, tooltips educativos, tutoriais interativos |

### Plano de Contingência

**Se Steam API cair**:
1. Exibir mensagem amigável para usuários
2. Ativar sistema de retry automático
3. Permitir import manual como fallback
4. Notificar equipe técnica via PagerDuty

**Se economia inflacionar**:
1. Ajustar configurações de pontos em tempo real
2. Criar eventos de "queima" de pontos
3. Adicionar novos itens caros à loja
4. Oferecer promoções temporárias

---

## 📚 Documentação Adicional

### Para Desenvolvedores

- **[API Reference](./API_REFERENCE.md)** - Documentação completa de todos endpoints
- **[Schema Database](./DATABASE_SCHEMA.md)** - Estrutura detalhada do banco
- **[Integration Guide](./INTEGRATION_GUIDE.md)** - Como integrar novas plataformas
- **[Contributing](./CONTRIBUTING.md)** - Guia de contribuição

### Para Product Managers

- **[User Stories](./USER_STORIES.md)** - Histórias de usuários completas
- **[Analytics Setup](./ANALYTICS_SETUP.md)** - Configuração de métricas
- **[A/B Test Plan](./AB_TEST_PLAN.md)** - Plano de testes A/B

---

## ✅ Checklist de Implementação

### Fase 1 - Fundação
- [ ] Migração de banco de dados
- [ ] API CRUD de jogos
- [ ] UI de separação de seções
- [ ] Testes unitários
- [ ] Documentação de API

### Fase 2 - Integração Steam
- [ ] Setup de autenticação Steam
- [ ] Importação de biblioteca
- [ ] Sincronização de conquistas
- [ ] UI de integração
- [ ] Testes end-to-end

### Fase 3 - Gamificação
- [ ] Sistema de pontos e XP
- [ ] Sistema de níveis
- [ ] Loja de itens
- [ ] Sistema de badges
- [ ] Notificações de conquistas

### Fase 4 - Social
- [ ] Perfil público
- [ ] Sistema de amigos
- [ ] Feed de atividades
- [ ] Compartilhamento social

### Fase 5 - Premium
- [ ] Features premium
- [ ] Integração com Stripe
- [ ] Analytics avançados
- [ ] Export de dados

---

## 🎯 Próximos Passos

1. **Aprovação do Roadmap**: Revisão com stakeholders
2. **Alocação de Recursos**: Definir time e budget
3. **Setup de Ambiente**: Criar ambientes de dev/staging
4. **Kick-off Sprint 1.1**: Começar migração de dados
5. **Setup de Métricas**: Implementar tracking de eventos

---

## 📞 Contatos

**Product Manager**: [Seu Nome]
**Tech Lead**: [Nome do Tech Lead]
**Design Lead**: [Nome do Designer]

**Canais de Comunicação**:
- Slack: #projeto-biblioteca-gamificacao
- Jira: [Link do Board]
- Figma: [Link dos Designs]

---

**Última Revisão**: 2026-01-13
**Versão do Documento**: 1.0
**Status**: 🟡 Em Planejamento
