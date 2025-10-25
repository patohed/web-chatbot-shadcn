// Factory para crear instancia de CloseSaleUseCase con todas sus dependencias
// Actualizado con variables de entorno configuradas en Netlify
import { CloseSaleUseCase } from '../use-cases/close-sale-use-case';
import { LeadService } from '../services/lead-service';
import { EmailService } from '../services/email-service';

export class CloseSaleFactory {
  static create(): CloseSaleUseCase {
    // Obtener configuración desde variables de entorno
    const resendApiKey = process.env.RESEND_API_KEY || '';
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const toEmail = process.env.EMAIL_TO || 'millanpatricio@hotmail.com';

    // Logging detallado para debugging
    console.log('[CloseSaleFactory] Configuración de Email:');
    console.log('  - RESEND_API_KEY:', resendApiKey ? `${resendApiKey.substring(0, 10)}...` : '❌ NO CONFIGURADA');
    console.log('  - EMAIL_FROM:', fromEmail);
    console.log('  - EMAIL_TO:', toEmail);

    // Validar configuración crítica
    if (!resendApiKey) {
      console.error('❌ [CloseSaleFactory] RESEND_API_KEY no está configurada en las variables de entorno');
    }

    // Crear servicios
    const leadService = new LeadService();
    const emailService = new EmailService(resendApiKey, fromEmail, toEmail);

    // Crear y retornar use case
    return new CloseSaleUseCase(leadService, emailService);
  }
}
