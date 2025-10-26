// Factory para crear instancia de CloseSaleUseCase con todas sus dependencias
// Actualizado con variables de entorno configuradas en Netlify
import { CloseSaleUseCase } from '../use-cases/close-sale-use-case';
import { LeadService } from '../services/lead-service';
import { EmailService } from '../services/email-service';

export class CloseSaleFactory {
  static create(): CloseSaleUseCase {
    // Obtener configuración desde variables de entorno
    // RESEND_API_KEY ahora es la App Password de Gmail (mantenemos el nombre por compatibilidad)
    const gmailAppPassword = process.env.RESEND_API_KEY || '';
    const fromEmail = process.env.EMAIL_FROM || 'patriciomillan10@gmail.com';
    const toEmail = process.env.EMAIL_TO || 'patriciomillan10@gmail.com';

    // Logging detallado para debugging
    console.log('[CloseSaleFactory] Configuración de Email (Nodemailer):');
    console.log('  - Gmail App Password:', gmailAppPassword ? '✅ Configurada' : '❌ NO CONFIGURADA');
    console.log('  - EMAIL_FROM:', fromEmail);
    console.log('  - EMAIL_TO:', toEmail);

    // Validar configuración crítica
    if (!gmailAppPassword) {
      console.error('❌ [CloseSaleFactory] Gmail App Password no está configurada');
      console.error('💡 [CloseSaleFactory] Genera una en: https://myaccount.google.com/apppasswords');
    }

    // Crear servicios
    const leadService = new LeadService();
    const emailService = new EmailService(gmailAppPassword, fromEmail, toEmail);

    // Crear y retornar use case
    return new CloseSaleUseCase(leadService, emailService);
  }
}
