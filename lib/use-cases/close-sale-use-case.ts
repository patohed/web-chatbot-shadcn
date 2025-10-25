// Application Layer - Caso de uso para cierre de ventas
import { LeadRequest, EmailResponse } from '@/types/lead';
import { LeadService } from '../services/lead-service';
import { EmailService } from '../services/email-service';

export class CloseSaleUseCase {
  constructor(
    private leadService: LeadService,
    private emailService: EmailService
  ) {}

  async execute(leadRequest: LeadRequest): Promise<EmailResponse> {
    try {
      // Validar datos mínimos
      if (!leadRequest.nombre || !leadRequest.email || !leadRequest.proyecto) {
        return {
          success: false,
          error: 'Faltan datos requeridos: nombre, email y proyecto son obligatorios',
        };
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(leadRequest.email)) {
        return {
          success: false,
          error: 'El formato del email es inválido',
        };
      }

      // 1. Guardar lead en el sistema
      const lead = await this.leadService.saveLead(leadRequest);

      // 2. Enviar notificación por email
      const emailResult = await this.emailService.sendLeadNotification(lead);

      if (!emailResult.success) {
        console.error('[CloseSaleUseCase] Email no enviado, pero lead guardado:', lead.id);
        // Aún así consideramos exitoso porque el lead se guardó
        return {
          success: true,
          leadId: lead.id,
          error: 'Lead guardado pero el email falló. Revisa los logs.',
        };
      }

      return {
        success: true,
        leadId: lead.id,
      };
    } catch (error) {
      console.error('[CloseSaleUseCase] Error completo:', error);
      console.error('[CloseSaleUseCase] Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('[CloseSaleUseCase] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return {
        success: false,
        error: `Error interno al procesar el lead: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
