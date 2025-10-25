// Factory - Dependency Injection
import { ChatUseCase } from '../use-cases/chat-use-case';
import { AIService } from '../services/ai-service';
import { RateLimitService } from '../services/rate-limit-service';
import { CaptchaService } from '../services/captcha-service';
import { ValidationService } from '../services/validation-service';
import { SYSTEM_PROMPT } from '../prompts/system-prompt';
import { validateConfig } from '../config';

export class ChatUseCaseFactory {
  static create(): ChatUseCase {
    // Validar configuración
    const configValidation = validateConfig();
    if (!configValidation.valid) {
      throw new Error(`Configuración inválida: ${configValidation.errors.join(', ')}`);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no configurada');
    }

    // Crear servicios
    const aiService = new AIService(apiKey, SYSTEM_PROMPT);
    const rateLimitService = new RateLimitService();
    const captchaService = new CaptchaService();
    const validationService = new ValidationService();

    // Crear caso de uso
    return new ChatUseCase(
      aiService,
      rateLimitService,
      captchaService,
      validationService
    );
  }
}
