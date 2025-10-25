// Infrastructure Layer - Servicio de Leads
import { Lead, LeadRequest } from '@/types/lead';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export class LeadService {
  private leadsFilePath: string;

  constructor() {
    // En desarrollo: guardar en archivo local
    // En producción con Netlify: podrías usar Netlify Forms o una DB
    this.leadsFilePath = path.join(process.cwd(), 'data', 'leads.json');
  }

  async saveLead(leadRequest: LeadRequest): Promise<Lead> {
    const lead: Lead = {
      id: randomUUID(),
      nombre: leadRequest.nombre,
      email: leadRequest.email,
      proyecto: leadRequest.proyecto,
      telefono: leadRequest.telefono,
      conversacion: leadRequest.conversacion,
      resumenConversacion: leadRequest.resumenConversacion,
      fechaCreacion: new Date(),
    };

    try {
      // Asegurar que existe el directorio
      const dataDir = path.dirname(this.leadsFilePath);
      await fs.mkdir(dataDir, { recursive: true });

      // Leer leads existentes
      let leads: Lead[] = [];
      try {
        const data = await fs.readFile(this.leadsFilePath, 'utf-8');
        leads = JSON.parse(data);
      } catch {
        // Si no existe el archivo, empezar con array vacío
        leads = [];
      }

      // Agregar nuevo lead
      leads.push(lead);

      // Guardar
      await fs.writeFile(this.leadsFilePath, JSON.stringify(leads, null, 2), 'utf-8');

      console.log('[LeadService] ✅ Lead guardado en archivo:', lead.id);
      return lead;
    } catch (error) {
      // En Netlify el filesystem es read-only, así que el archivo no se puede guardar
      // Pero igual devolvemos el lead para que el email se envíe
      console.warn('[LeadService] ⚠️ No se pudo guardar en archivo (filesystem read-only en producción)');
      console.warn('[LeadService] Error:', error instanceof Error ? error.message : error);
      console.log('[LeadService] ✅ Lead creado (solo en memoria):', lead.id);
      console.log('[LeadService] 💡 Considera usar Netlify Forms, Supabase o una DB para persistencia en producción');
      
      // IMPORTANTE: No lanzar error, devolver el lead para que continúe el flujo
      return lead;
    }
  }

  async getAllLeads(): Promise<Lead[]> {
    try {
      const data = await fs.readFile(this.leadsFilePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
}
