/**
 * Rate Limiting para endpoints de autenticação
 * Implementação in-memory para desenvolvimento/produção sem Redis
 * Para produção em escala, considere usar @upstash/ratelimit com Redis
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Limpar entradas expiradas a cada minuto
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  async limit(identifier: string): Promise<{
    success: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Nova janela
      const resetTime = now + this.windowMs;
      this.store.set(identifier, { count: 1, resetTime });
      return {
        success: true,
        remaining: this.maxRequests - 1,
        resetTime,
      };
    }

    if (entry.count >= this.maxRequests) {
      // Limite excedido
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Incrementar contador
    entry.count++;
    this.store.set(identifier, entry);

    return {
      success: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  async reset(identifier: string): Promise<void> {
    this.store.delete(identifier);
  }
}

// Rate limiters para diferentes endpoints
// Login: 5 tentativas por minuto por IP
export const loginRateLimiter = new RateLimiter(5, 60 * 1000);

// Login por email: 10 tentativas por 15 minutos por email
export const loginEmailRateLimiter = new RateLimiter(10, 15 * 60 * 1000);

// Registro: 3 tentativas por minuto por IP
export const registerRateLimiter = new RateLimiter(3, 60 * 1000);

// Forgot Password: 3 tentativas por 15 minutos por IP
export const forgotPasswordRateLimiter = new RateLimiter(3, 15 * 60 * 1000);

// Reset Password: 5 tentativas por 15 minutos por IP
export const resetPasswordRateLimiter = new RateLimiter(5, 15 * 60 * 1000);

// ========== RATE LIMITERS PARA APIs DO DASHBOARD ==========

// API geral (leitura): 100 requisições por minuto por usuário
export const apiReadRateLimiter = new RateLimiter(100, 60 * 1000);

// API de criação: 30 requisições por minuto por usuário
export const apiCreateRateLimiter = new RateLimiter(30, 60 * 1000);

// API de atualização: 30 requisições por minuto por usuário
export const apiUpdateRateLimiter = new RateLimiter(30, 60 * 1000);

// API de deleção: 20 requisições por minuto por usuário
export const apiDeleteRateLimiter = new RateLimiter(20, 60 * 1000);

// Operações pesadas (AI, export): 5 por minuto
export const apiHeavyRateLimiter = new RateLimiter(5, 60 * 1000);

// Verificação de username: 30 por minuto por IP (para verificação em tempo real)
export const usernameCheckRateLimiter = new RateLimiter(30, 60 * 1000);

// Função helper para extrair IP da requisição
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

// Função helper para criar resposta de rate limit
export function rateLimitResponse(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Muitas tentativas. Por favor, aguarde antes de tentar novamente.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': resetTime.toString(),
      },
    }
  );
}

/**
 * Wrapper para aplicar rate limiting em APIs do Dashboard
 * Uso: return withApiRateLimit(req, userId, 'create', async () => { ... })
 */
export async function withApiRateLimit(
  req: Request,
  userId: string,
  operation: 'read' | 'create' | 'update' | 'delete' | 'heavy',
  handler: () => Promise<Response>
): Promise<Response> {
  const limiters = {
    read: apiReadRateLimiter,
    create: apiCreateRateLimiter,
    update: apiUpdateRateLimiter,
    delete: apiDeleteRateLimiter,
    heavy: apiHeavyRateLimiter,
  };

  const limiter = limiters[operation];
  const identifier = `${userId}:${operation}`;
  const result = await limiter.limit(identifier);

  if (!result.success) {
    return rateLimitResponse(result.resetTime);
  }

  const response = await handler();

  // Adicionar headers de rate limit à resposta
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetTime.toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
