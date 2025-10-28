// Application Layer - Caso de uso para cierre de ventas
import { LeadRequest, EmailResponse } from '@/types/lead';
import { LeadService } from '../services/lead-service';
import { SupabaseService } from '../services/supabase-service';

export class CloseSaleUseCase {
  constructor(
    private leadService: LeadService,
    private supabaseService: SupabaseService
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

      // 1. Guardar lead en el sistema (archivo local para backup)
      const lead = await this.leadService.saveLead(leadRequest);

      // 2. Guardar lead en Supabase (base de datos en la nube)
      console.log('[CloseSaleUseCase] � Guardando en Supabase...');
      const supabaseResult = await this.supabaseService.saveLead(lead);

      if (!supabaseResult.success) {
        console.error('[CloseSaleUseCase] ❌ Supabase falló:', supabaseResult.error);
        // Aún así consideramos exitoso porque el lead se guardó localmente
        return {
          success: true,
          leadId: lead.id,
          emailSent: false, // Ahora significa "guardado en BD"
          error: supabaseResult.error || 'Lead guardado localmente pero falló Supabase.',
        };
      }

      console.log('[CloseSaleUseCase] ✅ Lead guardado en Supabase exitosamente');
      return {
        success: true,
        leadId: lead.id,
        emailSent: true, // true = guardado en Supabase
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
