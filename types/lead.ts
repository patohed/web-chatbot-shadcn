// Domain types para el sistema de leads
export interface Lead {
  id: string;
  nombre: string;
  email: string;
  proyecto: string;
  telefono?: string;
  fechaCreacion: Date;
  conversacion?: string[]; // Historial de mensajes relevantes
  resumenConversacion?: string; // Resumen generado por IA
}

export interface LeadRequest {
  nombre: string;
  email: string;
  proyecto: string;
  telefono?: string;
  conversacion?: string[];
  resumenConversacion?: string; // Resumen de la conversación
}

export interface EmailResponse {
  success: boolean;
  error?: string;
  leadId?: string;
}
