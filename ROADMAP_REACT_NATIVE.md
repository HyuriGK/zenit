# Roadmap - Implementação React Native App (Zenit)

## 1. Visão Geral da Tecnologia

### O que é React Native?
React Native é um framework desenvolvido pelo Facebook que permite criar aplicativos móveis nativos usando JavaScript e React. A principal diferença para desenvolvimento web é que, em vez de renderizar para HTML/CSS, o React Native renderiza componentes nativos reais do iOS e Android.

**Principais características:**
- **Multiplataforma**: Um único código base para iOS e Android
- **Performance nativa**: Usa componentes nativos reais, não WebViews
- **Hot Reload**: Veja mudanças instantaneamente durante o desenvolvimento
- **Ecossistema React**: Use hooks, context, e outros conceitos familiares do React
- **Compartilhamento de código**: Até 90% do código pode ser compartilhado entre plataformas

### Arquitetura React Native

```
┌─────────────────────────────────────────┐
│     JavaScript Thread (React)           │
│  - Lógica de negócio                    │
│  - Estado da aplicação                  │
│  - API calls                            │
└─────────────┬───────────────────────────┘
              │
         [Bridge/JSI]
              │
┌─────────────┴───────────────────────────┐
│     Native Thread (iOS/Android)         │
│  - Renderização de UI                   │
│  - Gestos e interações                  │
│  - APIs nativas                         │
└─────────────────────────────────────────┘
```

### Diferenças Web vs Mobile

| Aspecto | Web (Next.js) | Mobile (React Native) |
|---------|---------------|----------------------|
| Componentes | `<div>`, `<span>` | `<View>`, `<Text>` |
| Estilização | CSS/Tailwind | StyleSheet API/Flexbox |
| Navegação | URL/Router | Stack/Tab Navigators |
| Storage | localStorage | AsyncStorage/MMKV |
| Network | fetch/axios | fetch/axios (igual) |
| Autenticação | Cookies/Sessions | Token/SecureStore |

---

## 2. Estrutura do Projeto Mobile

### Monorepo Recomendado
```
zenit/
├── packages/
│   ├── web/                    # Next.js existente
│   │   ├── app/
│   │   ├── components/
│   │   └── package.json
│   │
│   ├── mobile/                 # Novo app React Native
│   │   ├── app/                # Expo Router (navegação)
│   │   ├── components/         # Componentes mobile
│   │   ├── hooks/              # Hooks compartilhados
│   │   ├── services/           # API calls
│   │   ├── app.json
│   │   └── package.json
│   │
│   └── shared/                 # Código compartilhado
│       ├── types/              # TypeScript types
│       ├── utils/              # Funções utilitárias
│       ├── schemas/            # Zod schemas
│       └── package.json
│
├── prisma/                     # Database (compartilhado)
└── package.json                # Root workspace
```

---

## 3. Roadmap de Implementação

### Fase 1: Setup Inicial (Semana 1-2)

#### 1.1 Configuração do Ambiente
- [ ] Instalar Node.js 18+ e npm/yarn/pnpm
- [ ] Instalar Expo CLI: `npm install -g expo-cli`
- [ ] Instalar EAS CLI: `npm install -g eas-cli`
- [ ] Configurar Android Studio (para emulador Android)
- [ ] Configurar Xcode (para emulador iOS - apenas macOS)

#### 1.2 Criar Projeto React Native
```bash
# Na raiz do projeto
npx create-expo-app@latest packages/mobile --template blank-typescript

# Ou com Expo Router (navegação baseada em arquivos)
npx create-expo-app@latest packages/mobile --template tabs
```

#### 1.3 Configurar Monorepo
- [ ] Configurar pnpm/yarn workspaces
- [ ] Criar package `@zenit/shared` para código compartilhado
- [ ] Mover types e schemas para shared
- [ ] Configurar path aliases (`@/`, `@shared/`)

**Arquivo: `package.json` (root)**
```json
{
  "name": "zenit-workspace",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "web:dev": "cd packages/web && pnpm dev",
    "mobile:dev": "cd packages/mobile && expo start",
    "mobile:android": "cd packages/mobile && expo start --android",
    "mobile:ios": "cd packages/mobile && expo start --ios"
  }
}
```

#### 1.4 Dependências Essenciais
```bash
cd packages/mobile

# Navegação
npx expo install expo-router react-native-safe-area-context react-native-screens

# UI Components
npm install @rneui/themed @rneui/base
npm install react-native-reanimated

# Autenticação
npx expo install expo-secure-store
npm install @react-native-async-storage/async-storage

# Forms
npm install react-hook-form @hookform/resolvers zod

# Date handling
npm install date-fns

# API
npm install swr axios

# Icons
npm install @expo/vector-icons
```

---

### Fase 2: Infraestrutura Base (Semana 3-4)

#### 2.1 Estrutura de Navegação
- [ ] Configurar Expo Router (file-based routing)
- [ ] Criar Stack Navigator para fluxo de autenticação
- [ ] Criar Tab Navigator para tela principal
- [ ] Implementar navegação profunda (deep linking)

**Estrutura de rotas:**
```
packages/mobile/app/
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx              # Dashboard
│   ├── study.tsx              # Páginas de estudo
│   ├── homework.tsx           # Tarefas
│   └── profile.tsx            # Perfil
└── _layout.tsx                # Root layout
```

#### 2.2 Sistema de Autenticação
- [ ] Criar AuthContext com React Context
- [ ] Implementar login com email/senha
- [ ] Implementar OAuth (Google) com Expo AuthSession
- [ ] Armazenar token em SecureStore
- [ ] Criar hook `useAuth()` compartilhado
- [ ] Implementar refresh token automático

**Exemplo de implementação:**
```typescript
// packages/mobile/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      // Validar token e carregar usuário
    }
    setIsLoading(false);
  }

  // ... resto da implementação
}
```

#### 2.3 API Client e Cache
- [ ] Criar API client com axios
- [ ] Configurar interceptors para autenticação
- [ ] Implementar SWR para cache e revalidação
- [ ] Criar hooks customizados por recurso (`useStudyPages`, `useHomework`)
- [ ] Implementar sincronização offline (opcional)

**Exemplo:**
```typescript
// packages/mobile/services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

### Fase 3: Features Core (Semana 5-8)

#### 3.1 Dashboard
- [ ] Implementar tela de dashboard
- [ ] Listar matérias do usuário
- [ ] Mostrar estatísticas de estudo
- [ ] Implementar gráficos com recharts ou react-native-chart-kit
- [ ] Pull-to-refresh para atualizar dados

#### 3.2 Páginas de Estudo
- [ ] Listar páginas de estudo por matéria
- [ ] Visualizador de conteúdo (similar ao TipTap)
  - Avaliar: TipTap tem suporte limitado no mobile
  - Alternativa: usar WebView com HTML renderizado
  - Alternativa: react-native-render-html
- [ ] Sistema de busca
- [ ] Filtros e ordenação
- [ ] Navegação entre páginas

**Desafio do TipTap:**
TipTap/ProseMirror não funciona nativamente no React Native. Opções:
1. **WebView**: Renderizar HTML em WebView (mais fácil, menos nativo)
2. **React Native Render HTML**: Converter para componentes nativos
3. **Editor nativo**: Usar react-native-text-input-with-markdown

```typescript
// Opção 1: WebView
import { WebView } from 'react-native-webview';

function StudyPageViewer({ content }: { content: string }) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui; padding: 16px; }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `;

  return <WebView source={{ html }} />;
}
```

#### 3.3 Sistema de Tarefas (Homework)
- [ ] Listar tarefas pendentes e concluídas
- [ ] Criar/editar tarefas
- [ ] Marcar como concluída
- [ ] Notificações de prazo
- [ ] Drag-and-drop para reordenar (opcional)

#### 3.4 Perfil e Configurações
- [ ] Tela de perfil do usuário
- [ ] Editar informações pessoais
- [ ] Upload de foto (Expo ImagePicker)
- [ ] Configurações da conta
- [ ] Tema claro/escuro
- [ ] Logout

---

### Fase 4: Features Avançadas (Semana 9-12)

#### 4.1 Notificações Push
- [ ] Configurar Expo Notifications
- [ ] Backend: enviar notificações via Expo Push API
- [ ] Notificações de tarefas com prazo próximo
- [ ] Notificações de novas páginas de estudo
- [ ] Preferências de notificação

```bash
npx expo install expo-notifications expo-device expo-constants
```

#### 4.2 Upload de Imagens
- [ ] Integrar Expo ImagePicker
- [ ] Comprimir imagens antes do upload
- [ ] Upload para storage (considerar Cloudinary/S3)
- [ ] Exibir imagens nas páginas de estudo

#### 4.3 Offline Support
- [ ] Implementar cache persistente com MMKV
- [ ] Queue de sincronização para ações offline
- [ ] Indicador de status online/offline
- [ ] Retry automático de requests falhados

#### 4.4 Performance e UX
- [ ] Implementar skeleton loaders
- [ ] Otimizar listas com FlashList
- [ ] Lazy loading de imagens
- [ ] Animações com Reanimated
- [ ] Gestos com React Native Gesture Handler

---

### Fase 5: Build e Deploy (Semana 13-14)

#### 5.1 Preparação para Build
- [ ] Criar ícones e splash screen
- [ ] Configurar app.json/app.config.js
- [ ] Definir bundle identifiers
- [ ] Configurar versioning

**app.json exemplo:**
```json
{
  "expo": {
    "name": "Zenit",
    "slug": "zenit-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.zenit.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.zenit.app"
    }
  }
}
```

#### 5.2 Build com EAS (Expo Application Services)
```bash
# Configurar EAS
eas login
eas build:configure

# Build de desenvolvimento
eas build --profile development --platform android
eas build --profile development --platform ios

# Build de produção
eas build --profile production --platform all
```

#### 5.3 Deploy
- [ ] **Android**: Publicar na Google Play Store
  - Criar conta de desenvolvedor ($25 única vez)
  - Preparar screenshots e descrição
  - Criar internal testing track
  - Submit para review

- [ ] **iOS**: Publicar na App Store
  - Conta Apple Developer ($99/ano)
  - Configurar App Store Connect
  - TestFlight para beta testing
  - Submit para review

#### 5.4 OTA Updates (Over-The-Air)
- [ ] Configurar Expo Updates
- [ ] CI/CD para deployments automáticos
- [ ] Versionamento de updates

```bash
# Publicar update sem rebuild
eas update --branch production --message "Fix: correção de bug"
```

---

## 4. Diferenças de Implementação: Web vs Mobile

### 4.1 Componentes de UI

#### Web (Next.js + Radix UI)
```tsx
// Web
import { Dialog, DialogContent } from "@/components/ui/dialog";

function MyDialog() {
  return (
    <Dialog>
      <DialogContent className="sm:max-w-[425px]">
        <div className="grid gap-4 py-4">
          <input className="col-span-3" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### Mobile (React Native)
```tsx
// Mobile
import { Modal, View, TextInput, StyleSheet } from 'react-native';

function MyDialog() {
  return (
    <Modal animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.content}>
          <TextInput style={styles.input} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 4,
  },
});
```

### 4.2 Estilização

#### Web (Tailwind CSS)
```tsx
<div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900">Título</h2>
  <p className="text-gray-600">Conteúdo</p>
</div>
```

#### Mobile (StyleSheet)
```tsx
import { View, Text, StyleSheet } from 'react-native';

<View style={styles.card}>
  <Text style={styles.title}>Título</Text>
  <Text style={styles.content}>Conteúdo</Text>
</View>

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    gap: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
  content: {
    fontSize: 16,
    color: '#666',
  },
});
```

**Alternativa: NativeWind (Tailwind para RN)**
```tsx
// Com NativeWind
import { View, Text } from 'react-native';

<View className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
  <Text className="text-2xl font-bold text-gray-900">Título</Text>
  <Text className="text-gray-600">Conteúdo</Text>
</View>
```

### 4.3 Navegação

#### Web (Next.js App Router)
```tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function Navigation() {
  const router = useRouter();

  return (
    <Link href="/study/page-123">
      Ver página
    </Link>
  );
}
```

#### Mobile (Expo Router)
```tsx
import { Link, router } from 'expo-router';

function Navigation() {
  return (
    <Link href="/study/page-123">
      Ver página
    </Link>
  );
}
```

### 4.4 Autenticação

#### Web (NextAuth)
```tsx
import { signIn, signOut, useSession } from 'next-auth/react';

function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return <button onClick={() => signOut()}>Logout</button>;
  }
  return <button onClick={() => signIn()}>Login</button>;
}
```

#### Mobile (Custom Auth)
```tsx
import { useAuth } from '@/contexts/AuthContext';

function AuthButton() {
  const { user, login, logout } = useAuth();

  if (user) {
    return <Button onPress={logout} title="Logout" />;
  }
  return <Button onPress={() => login(email, password)} title="Login" />;
}
```

---

## 5. Stack Tecnológica Recomendada

### Core
- **Framework**: Expo (managed workflow)
- **Linguagem**: TypeScript
- **Navegação**: Expo Router (file-based)
- **Estado**: React Context + SWR

### UI e Styling
- **Componentes**: React Native Elements ou NativeBase
- **Styling**: NativeWind (Tailwind para RN) ou StyleSheet
- **Animações**: React Native Reanimated
- **Gestos**: React Native Gesture Handler
- **Ícones**: @expo/vector-icons

### Data e API
- **HTTP Client**: Axios
- **Cache**: SWR
- **Storage**: AsyncStorage (dados) + SecureStore (tokens)
- **Validação**: Zod (compartilhado com web)
- **Forms**: React Hook Form

### Features Nativas
- **Notificações**: Expo Notifications
- **Imagens**: Expo Image Picker
- **Câmera**: Expo Camera
- **Location**: Expo Location
- **Haptics**: Expo Haptics

### Desenvolvimento
- **Build**: EAS Build
- **Updates**: EAS Update
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint + Prettier

---

## 6. Desafios e Considerações

### 6.1 Editor de Texto Rico (TipTap)
**Problema**: TipTap não funciona nativamente no React Native.

**Soluções:**
1. **Visualização apenas** (recomendado para MVP):
   - Usar WebView ou react-native-render-html
   - Edição continua sendo apenas na web

2. **Editor completo mobile**:
   - Implementar editor markdown nativo
   - Ou usar bibliotecas como react-native-quill-wrapper

### 6.2 Sincronização de Dados
- Implementar estratégia de cache inteligente
- Considerar offline-first com queue de sincronização
- Usar timestamps para conflict resolution

### 6.3 Performance
- Listas longas: usar FlashList em vez de FlatList
- Imagens: lazy loading e caching
- Animações: usar worklets do Reanimated para 60fps
- Bundle size: code splitting e lazy loading

### 6.4 Plataformas
- iOS e Android têm comportamentos diferentes
- Testar em dispositivos reais, não apenas emuladores
- Considerar Safe Area para notch/island
- StatusBar styling por plataforma

### 6.5 Aprovação das Stores
- **Google Play**: Review em 1-3 dias, mais flexível
- **App Store**: Review em 1-7 dias, guidelines rigorosas
- Preparar materiais (screenshots, privacy policy, etc)

---

## 7. Estrutura de Código Compartilhado

```typescript
// packages/shared/types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface StudyPage {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  createdAt: Date;
  updatedAt: Date;
}

// packages/shared/api/endpoints.ts
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
  },
  studyPages: {
    list: '/api/study-pages',
    get: (id: string) => `/api/study-pages/${id}`,
    create: '/api/study-pages',
  },
};

// packages/shared/utils/validation.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Ambos web e mobile usam o mesmo schema!
```

---

## 8. Cronograma Estimado

| Fase | Duração | Entregas |
|------|---------|----------|
| Fase 1: Setup | 1-2 semanas | Projeto configurado, monorepo funcionando |
| Fase 2: Infra Base | 2 semanas | Auth, navegação, API client |
| Fase 3: Features Core | 3-4 semanas | Dashboard, study pages, homework |
| Fase 4: Features Avançadas | 3-4 semanas | Notificações, offline, polish |
| Fase 5: Deploy | 1-2 semanas | Build, publicação nas stores |
| **Total** | **10-14 semanas** | App completo nas lojas |

---

## 9. Recursos de Aprendizado

### Documentação Oficial
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

### Tutoriais
- [React Native Tutorial for Beginners](https://www.youtube.com/watch?v=0-S5a0eXPoc)
- [Expo in 100 Seconds](https://www.youtube.com/watch?v=vAjB3BsJJjw)

### Comunidades
- Discord do Expo
- r/reactnative no Reddit
- Stack Overflow

---

## 10. Checklist de Início Rápido

Para começar hoje mesmo:

```bash
# 1. Criar projeto mobile
npx create-expo-app@latest packages/mobile --template tabs

# 2. Navegar para o diretório
cd packages/mobile

# 3. Instalar dependências essenciais
npx expo install expo-router react-native-safe-area-context react-native-screens
npm install @rneui/themed axios swr

# 4. Iniciar o servidor de desenvolvimento
npx expo start

# 5. Abrir no emulador ou dispositivo físico
# Pressione 'a' para Android ou 'i' para iOS
# Ou escaneie o QR code com o app Expo Go
```

---

## Próximos Passos

1. **Revisar este roadmap** e ajustar conforme necessidades específicas
2. **Decidir arquitetura**: monorepo ou repositório separado?
3. **Escolher UI library**: NativeWind, React Native Elements, ou NativeBase?
4. **Definir MVP**: quais features são essenciais para primeira versão?
5. **Configurar ambiente** de desenvolvimento local
6. **Criar projeto** e começar pela autenticação

---

**Última atualização**: 2026-01-07
**Versão**: 1.0
