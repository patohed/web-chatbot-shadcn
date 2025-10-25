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

      console.log('[LeadService] Lead guardado:', lead.id);
      return lead;
    } catch (error) {
      console.error('[LeadService] Error guardando lead:', error);
      throw new Error('Error al guardar el lead');
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
