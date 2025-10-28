// Factory para crear instancia de CloseSaleUseCase con todas sus dependencias
// Actualizado para usar Supabase en vez de email
import { CloseSaleUseCase } from '../use-cases/close-sale-use-case';
import { LeadService } from '../services/lead-service';
import { SupabaseService } from '../services/supabase-service';

export class CloseSaleFactory {
  static create(): CloseSaleUseCase {
    // Obtener configuración desde variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Logging detallado para debugging
    console.log('[CloseSaleFactory] Configuración de Supabase:');
    console.log('  - SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ NO CONFIGURADA');
    console.log('  - SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurada' : '❌ NO CONFIGURADA');

    // Validar configuración crítica
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ [CloseSaleFactory] Credenciales de Supabase no configuradas');
      console.error('💡 [CloseSaleFactory] Configura en .env.local y en Netlify');
    }

    // Crear servicios
    const leadService = new LeadService();
    const supabaseService = new SupabaseService(supabaseUrl, supabaseAnonKey);

    // Crear y retornar use case
    return new CloseSaleUseCase(leadService, supabaseService);
  }
}
