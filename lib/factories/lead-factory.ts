// Factory para crear instancia de CloseSaleUseCase con todas sus dependencias
import { CloseSaleUseCase } from '../use-cases/close-sale-use-case';
import { LeadService } from '../services/lead-service';
import { EmailService } from '../services/email-service';

export class CloseSaleFactory {
  static create(): CloseSaleUseCase {
    // Obtener configuración desde variables de entorno
    const resendApiKey = process.env.RESEND_API_KEY || '';
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const toEmail = process.env.EMAIL_TO || 'millanpatricio@hotmail.com';

    // Crear servicios
    const leadService = new LeadService();
    const emailService = new EmailService(resendApiKey, fromEmail, toEmail);

    // Crear y retornar use case
    return new CloseSaleUseCase(leadService, emailService);
  }
}
