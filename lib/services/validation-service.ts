// Application Layer - Validación
import { config } from '../config';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class ValidationService {
  validateMessage(content: string): ValidationResult {
    // Validar contenido vacío
    if (!content || content.trim().length === 0) {
      return {
        isValid: false,
        error: 'El mensaje no puede estar vacío',
      };
    }

    // Validar longitud mínima
    if (content.trim().length < config.validation.minMessageLength) {
      return {
        isValid: false,
        error: 'El mensaje es demasiado corto',
      };
    }

    // Validar longitud máxima
    if (content.length > config.validation.maxMessageLength) {
      return {
        isValid: false,
        error: `El mensaje es demasiado largo. Máximo ${config.validation.maxMessageLength} caracteres`,
      };
    }

    // Sanitizar caracteres peligrosos (básico)
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // onclick=, onerror=, etc
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return {
          isValid: false,
          error: 'El mensaje contiene contenido no permitido',
        };
      }
    }

    return { isValid: true };
  }

  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .substring(0, config.validation.maxMessageLength);
  }
}
