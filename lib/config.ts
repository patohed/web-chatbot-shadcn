// Configuration - Centralizar todas las configuraciones
export const config = {
  openai: {
    model: 'gpt-4o',
    temperature: 0.8,
    maxTokens: 1000,
  },
  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  },
  captcha: {
    siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
    secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
    enabled: Boolean(process.env.RECAPTCHA_SECRET_KEY),
  },
  validation: {
    maxMessageLength: 2000,
    minMessageLength: 1,
  },
} as const;

// Validar que las configuraciones críticas estén presentes
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY no está configurada');
  }

  // En producción, validar captcha
  if (process.env.NODE_ENV === 'production' && !config.captcha.enabled) {
    console.warn('⚠️  CAPTCHA no configurado en producción');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
