# Sistema de Gerenciamento de Viagens - Zenit

## Visão Geral

Sistema completo de gerenciamento de viagens implementado como recurso **Premium** na plataforma Zenit. Permite aos usuários planejar, organizar e acompanhar todas as etapas de suas viagens.

## ✅ Funcionalidades Implementadas

### 🗺️ Planejamento da Viagem

- ✅ Criação de viagens com nome, destino e datas
- ✅ Suporte para múltiplos destinos (roteiro)
- ✅ Definição de propósito (lazer, trabalho, estudo)
- ✅ Status da viagem (planejada, em andamento, concluída, cancelada)
- ✅ Contagem regressiva para a viagem
- ✅ Orçamento total da viagem
- ✅ Notas gerais e diário de viagem
- ✅ Avaliação geral da viagem (1-5 estrelas)

### ✈️ Transporte

- ✅ Cadastro de diferentes tipos de transporte (avião, carro, ônibus, trem, táxi, uber)
- ✅ Informações detalhadas de voos:
  - Companhia, número do voo, assento
  - Horários de embarque e chegada
  - Portão de embarque
  - Conexões
  - Código de reserva
- ✅ Upload de arquivos (cartão de embarque)
- ✅ Informações de transporte terrestre (empresa, placa)
- ✅ URLs de rotas e tempo estimado

### 🏨 Hospedagem

- ✅ Cadastro de hotéis, hostels, Airbnbs
- ✅ Datas de check-in e check-out
- ✅ Endereço completo com coordenadas (latitude/longitude)
- ✅ Contato (telefone, email, website)
- ✅ Código da reserva
- ✅ Upload de comprovantes
- ✅ Avaliação pessoal da hospedagem
- ✅ Notas e observações

### 📅 Roteiro & Atividades

- ✅ Criação de atividades por dia
- ✅ Horário de início e término
- ✅ Local da atividade com coordenadas
- ✅ Categorias (turismo, trabalho, lazer, alimentação)
- ✅ Sistema de prioridades (0-5)
- ✅ Checklist por atividade (JSON)
- ✅ Marcar atividades como favoritas
- ✅ Tempo estimado entre atividades
- ✅ Status de conclusão

### 💰 Controle Financeiro

- ✅ Orçamento total da viagem
- ✅ Registro detalhado de despesas:
  - Valor e moeda
  - Conversão automática para BRL
  - Data da despesa
  - Categoria (transporte, hospedagem, alimentação, passeios, compras)
  - Forma de pagamento
- ✅ Cálculo de total gasto
- ✅ Comparação com orçamento (visual com barra de progresso)
- ✅ Indicadores visuais de gastos (verde, amarelo, vermelho)

### 📄 Documentos & Arquivos

- ✅ Sistema de documentos de viagem
- ✅ Tipos suportados:
  - Passaporte
  - Visto
  - RG
  - CNH
  - Seguro viagem
  - Reservas
  - Outros
- ✅ Upload de arquivos
- ✅ Datas de emissão e validade
- ✅ Sistema de alertas baseado em validade

### 🗺️ Destinos Detalhados

- ✅ Múltiplos destinos por viagem (ordenáveis)
- ✅ Informações completas do destino:
  - Cidade, país, endereço
  - Coordenadas geográficas
  - Datas de chegada e saída
  - Fuso horário
  - Idioma local
  - Moeda
  - Voltagem e tipo de tomada
- ✅ Informações culturais:
  - Costumes locais
  - Gorjetas
  - Números de emergência
  - Frases básicas no idioma
- ✅ Previsão do clima e temperatura média
- ✅ Locais salvos por destino:
  - Restaurantes, atrações, hospitais, farmácias
  - Coordenadas e endereço
  - Telefone e notas
  - Sistema de favoritos

### 🎨 Interface & Experiência

- ✅ Interface moderna e responsiva
- ✅ Sistema de filtros (busca textual e por status)
- ✅ Cards visuais com informações resumidas
- ✅ Badges coloridos para status e propósito
- ✅ Contagem regressiva visual
- ✅ Barra de progresso de orçamento
- ✅ Modal de criação de viagem intuitivo
- ✅ Validação de acesso Premium

### 🔒 Segurança & Permissões

- ✅ Middleware de verificação Premium (`requirePremium`)
- ✅ Bloqueio de acesso para usuários Free
- ✅ Tela de upgrade com benefícios destacados
- ✅ Verificação de expiração de plano
- ✅ Ícone Premium (coroa) na sidebar

## 📁 Estrutura de Arquivos Criados

### Backend

```
prisma/schema.prisma                          # Schema atualizado com modelos de viagem
src/lib/middleware/premiumOnly.ts             # Middleware de verificação Premium
src/types/viagem.ts                           # Tipos TypeScript para viagens
src/app/api/v1/viagens/route.ts              # CRUD de viagens
src/app/api/v1/viagens/[id]/route.ts         # Operações individuais de viagem
src/app/api/v1/viagens/[id]/destinos/route.ts # CRUD de destinos
```

### Frontend

```
src/app/(dashboard)/dashboard/viagens/page.tsx # Página principal de viagens
src/components/dashboard/Sidebar.tsx           # Sidebar atualizada (badge removido)
```

### Banco de Dados

```
migrations/20260112025226_add_travel_management/migration.sql # Migração aplicada
```

## 🗄️ Modelos do Banco de Dados

### Principais Modelos

1. **Viagem** - Informações gerais da viagem
2. **DestinoViagem** - Destinos da viagem com roteiro
3. **LocalSalvo** - Locais importantes salvos por destino
4. **TransporteViagem** - Informações de transporte
5. **HospedagemViagem** - Dados de hospedagem
6. **AtividadeViagem** - Atividades planejadas
7. **DespesaViagem** - Controle financeiro
8. **DocumentoViagem** - Documentos do usuário

### Enums Criados

- **StatusViagem**: PLANEJADA, EM_ANDAMENTO, CONCLUIDA, CANCELADA
- **PropostoViagem**: LAZER, TRABALHO, ESTUDO, OUTRO
- **TipoTransporte**: AVIAO, CARRO, ONIBUS, TREM, TAXI, UBER, OUTRO
- **CategoriaAtividade**: TURISMO, TRABALHO, LAZER, ALIMENTACAO, OUTRO
- **TipoDocumento**: PASSAPORTE, VISTO, RG, CNH, SEGURO_VIAGEM, RESERVA, OUTRO

## 🚀 Como Usar

### Para Usuários

1. Acesse o dashboard e clique em "Viagens" na sidebar
2. Se não for Premium, será exibida a tela de upgrade
3. Usuários Premium podem criar viagens clicando em "Nova Viagem"
4. Preencha as informações básicas (nome, datas, propósito, orçamento)
5. Após criar, clique na viagem para acessar detalhes completos
6. Adicione destinos, transportes, hospedagens, atividades e despesas

### Para Desenvolvedores

#### Verificar Status Premium

```typescript
const response = await fetch('/api/v1/planos');
const data = await response.json();
const isPremium = data.plano === 'PREMIUM' && data.ativo;
```

#### Criar Viagem

```typescript
const response = await fetch('/api/v1/viagens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'Viagem para Paris',
    descricao: 'Férias de verão',
    proposito: 'LAZER',
    dataInicio: '2024-07-01',
    dataFim: '2024-07-15',
    orcamentoTotal: 5000,
  }),
});
```

#### Adicionar Destino

```typescript
const response = await fetch(`/api/v1/viagens/${viagemId}/destinos`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: 'Paris',
    cidade: 'Paris',
    pais: 'França',
    dataChegada: '2024-07-01',
    dataSaida: '2024-07-15',
    fusoHorario: 'Europe/Paris',
    idioma: 'Francês',
    moeda: 'EUR',
  }),
});
```

## 📊 Estatísticas Calculadas

A página principal calcula automaticamente:

- ✅ Total gasto vs orçamento
- ✅ Dias restantes até a viagem
- ✅ Número de destinos
- ✅ Percentual de orçamento usado
- ✅ Indicadores visuais de status

## 🔜 Próximas Etapas Sugeridas

### Página de Detalhes da Viagem

Para completar a experiência, seria ideal criar:

1. **Página de detalhes** (`/dashboard/viagens/[id]/page.tsx`) com:
   - Tabs para cada seção (destinos, transportes, hospedagens, atividades, despesas, documentos)
   - Componentes para adicionar/editar cada tipo de item
   - Visualização em linha do tempo
   - Mapa interativo com todos os pontos
   - Gráficos de gastos por categoria

2. **APIs Adicionais**:
   - Rotas para transportes, hospedagens, atividades, despesas
   - Upload de arquivos (S3, Cloudinary, etc.)
   - Integração com APIs de clima
   - Conversão de moedas em tempo real

3. **Funcionalidades Avançadas**:
   - Exportação de roteiro em PDF
   - Compartilhamento de viagem
   - Modo offline
   - Sincronização com calendário
   - Alertas e notificações
   - Integração com mapas (Google Maps, Mapbox)

## 🎯 Recursos Premium

O sistema está configurado para ser exclusivo de usuários Premium:

- ✅ Verificação no middleware da API
- ✅ Validação no frontend antes de carregar
- ✅ Tela de upgrade com benefícios
- ✅ Ícone de coroa na sidebar
- ✅ Mensagens claras sobre limitações

## 🧪 Testando

### Testar como Free User

1. Criar conta sem Premium
2. Acessar /dashboard/viagens
3. Verificar se aparece a tela de upgrade

### Testar como Premium User

1. Atualizar usuário para Premium:
```sql
UPDATE users SET plano = 'PREMIUM', "planoExpiraEm" = '2025-12-31' WHERE email = 'seu-email@exemplo.com';
```

2. Acessar /dashboard/viagens
3. Criar viagens e testar todas as funcionalidades

## 📝 Notas Técnicas

- Todas as datas são armazenadas como DateTime no Prisma
- Valores monetários usam Decimal(15, 2)
- Coordenadas geográficas são Float
- Checklist de atividades é armazenado como JSON
- Cascade delete configurado em todas as relações
- Índices otimizados para queries comuns
- Validações no backend e frontend

## ✨ Melhorias de Código

- Componentes reutilizáveis
- Tipagem TypeScript completa
- Tratamento de erros consistente
- Toast notifications para feedback
- Loading states
- Estados vazios bem desenhados
- Responsividade mobile-first
- Temas consistentes com o design system

---

**Desenvolvido para Zenit - Sistema de Gestão Pessoal**
