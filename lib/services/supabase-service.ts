// Infrastructure Layer - Servicio de Supabase para persistir leads
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Lead } from '@/types/lead';

/**
 * 📚 SupabaseService - Gestión de leads en base de datos PostgreSQL
 * 
 * ¿Qué es Supabase?
 * - PostgreSQL en la nube (base de datos relacional)
 * - API REST automática generada desde el esquema de BD
 * - Row Level Security (RLS) para seguridad a nivel de fila
 * - Dashboard visual para ver/editar datos
 * 
 * Ventajas sobre email:
 * ✅ Persistencia confiable (no depende de SMTP/Gmail)
 * ✅ Búsqueda y filtrado de leads
 * ✅ Estadísticas y análisis
 * ✅ Sin límites de envío
 * ✅ Panel visual incluido
 */
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(url: string, anonKey: string) {
    // Crear cliente de Supabase
    // El 'anon key' es público pero protegido por RLS policies
    this.supabase = createClient(url, anonKey);

    console.log('[SupabaseService] ✅ Cliente Supabase inicializado');
    console.log('[SupabaseService]   URL:', url);
  }

  /**
   * Guarda un lead en la base de datos
   * 
   * Supabase hace:
   * 1. Valida el schema (tipos de datos, required fields)
   * 2. Aplica RLS policies (verifica si puede insertar)
   * 3. Genera UUID automático para 'id'
   * 4. Añade timestamp en 'created_at'
   * 5. Devuelve el registro insertado
   */
  async saveLead(lead: Lead): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[SupabaseService] 💾 Guardando lead en Supabase...');
      console.log('[SupabaseService]   Lead ID:', lead.id);
      console.log('[SupabaseService]   Email:', lead.email);

      // Insertar en tabla 'leads'
      // .insert() → INSERT INTO leads (...)
      // .select() → Devuelve el registro insertado
      const { data, error } = await this.supabase
        .from('leads')
        .insert([
          {
            id: lead.id, // UUID generado previamente
            nombre: lead.nombre,
            email: lead.email,
            telefono: lead.telefono || null,
            proyecto: lead.proyecto,
            resumen_conversacion: lead.resumenConversacion || null,
            conversacion: lead.conversacion || null, // JSONB array
          },
        ])
        .select()
        .single(); // Devuelve un objeto en vez de array

      if (error) {
        console.error('[SupabaseService] ❌ Error al guardar:', error.message);
        console.error('[SupabaseService] ❌ Code:', error.code);
        console.error('[SupabaseService] ❌ Details:', error.details);
        
        // Errores comunes:
        // - 23505: duplicate key (UUID repetido)
        // - 23502: not null violation (falta campo requerido)
        // - 42501: insufficient privilege (RLS policy rechazó)
        return {
          success: false,
          error: `Error de base de datos: ${error.message}`,
        };
      }

      console.log('[SupabaseService] ✅ Lead guardado exitosamente');
      console.log('[SupabaseService] 💡 Ver en dashboard:', `https://supabase.com/dashboard/project/_/editor/leads`);
      console.log('[SupabaseService] 💡 Registro:', data);

      return { success: true };
    } catch (error) {
      console.error('[SupabaseService] ❌ Error inesperado:', error);
      return {
        success: false,
        error: `Error al guardar lead: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Obtiene todos los leads (útil para dashboard futuro)
   * 
   * Nota: Esta función solo funciona si tienes una policy de SELECT
   * En nuestro caso, solo usuarios autenticados pueden leer leads
   */
  async getAllLeads(): Promise<Lead[]> {
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false }); // Más recientes primero

      if (error) {
        console.error('[SupabaseService] ❌ Error al obtener leads:', error);
        return [];
      }

      console.log('[SupabaseService] 📋 Leads obtenidos:', data?.length || 0);
      
      // Mapear de snake_case (PostgreSQL) a camelCase (TypeScript)
      interface SupabaseLeadRow {
        id: string;
        nombre: string;
        email: string;
        telefono: string;
        proyecto: string;
        created_at: string;
        conversacion: string[];
        resumen_conversacion: string;
      }
      
      return (data || []).map((row: SupabaseLeadRow) => ({
        id: row.id,
        nombre: row.nombre,
        email: row.email,
        telefono: row.telefono,
        proyecto: row.proyecto,
        fechaCreacion: new Date(row.created_at),
        conversacion: row.conversacion,
        resumenConversacion: row.resumen_conversacion,
      }));
    } catch (error) {
      console.error('[SupabaseService] ❌ Error inesperado:', error);
      return [];
    }
  }
}
