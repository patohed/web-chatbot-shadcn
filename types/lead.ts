// Domain types para el sistema de leads
export interface Lead {
  id: string;
  nombre: string;
  email: string;
  proyecto: string;
  telefono?: string;
  fechaCreacion: Date;
  conversacion?: string[]; // Historial de mensajes relevantes
}

export interface LeadRequest {
  nombre: string;
  email: string;
  proyecto: string;
  telefono?: string;
  conversacion?: string[];
}

export interface EmailResponse {
  success: boolean;
  error?: string;
  leadId?: string;
}
