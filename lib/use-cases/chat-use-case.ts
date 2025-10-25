// Application Layer - Casos de uso
import { Message, StreamResponse } from '@/types/domain';
import { AIService } from '../services/ai-service';
import { RateLimitService } from '../services/rate-limit-service';
import { CaptchaService } from '../services/captcha-service';
import { ValidationService } from '../services/validation-service';

export class ChatUseCase {
  constructor(
    private aiService: AIService,
    private rateLimitService: RateLimitService,
    private captchaService: CaptchaService,
    private validationService: ValidationService
  ) {}

  async execute(
    messages: Message[], // Ahora recibe todo el historial
    captchaToken: string,
    userIdentifier: string
  ): Promise<StreamResponse> {
    try {
      // 1. Validar entrada (último mensaje del usuario)
      const lastMessage = messages[messages.length - 1];
      const validationResult = this.validationService.validateMessage(lastMessage.content);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error,
        };
      }

      // 2. Verificar captcha (DESHABILITADO PARA PRUEBAS)
      // const captchaResult = await this.captchaService.verify(captchaToken);
      // if (!captchaResult.success) {
      //   return {
      //     success: false,
      //     error: 'Verificación de CAPTCHA fallida. Por favor, intentá de nuevo.',
      //   };
      // }

      // 3. Verificar rate limit
      const rateLimitResult = await this.rateLimitService.checkLimit(userIdentifier);
      if (!rateLimitResult.isAllowed) {
        return {
          success: false,
          error: `Límite de mensajes alcanzado. Esperá ${Math.ceil(rateLimitResult.msBeforeNext / 1000)} segundos.`,
        };
      }

      // 4. Procesar con IA (enviar todo el historial para mantener contexto)
      const stream = await this.aiService.generateStream(messages);
      
      return {
        success: true,
        stream,
      };
    } catch (error) {
      console.error('[ChatUseCase] Error:', this.sanitizeError(error));
      return {
        success: false,
        error: 'Error procesando tu mensaje. Por favor, intentá de nuevo.',
      };
    }
  }

  // No exponer detalles internos en errores
  private sanitizeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  }
}
