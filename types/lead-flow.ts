// Domain types para el flujo de conversación de cierre
export type LeadFlowStep = 
  | 'idle'           // No hay flujo activo
  | 'detecting'      // Detectando intención de compra
  | 'asking_name'    // Preguntando nombre
  | 'asking_email'   // Preguntando email
  | 'asking_phone'   // Preguntando teléfono (opcional)
  | 'asking_project' // Preguntando descripción del proyecto
  | 'confirm_send'   // NUEVO: Confirmación explícita de envío
  | 'confirming'     // Confirmando datos
  | 'completed';     // Flujo completado

export interface LeadFlowState {
  step: LeadFlowStep;
  data: {
    nombre?: string;
    email?: string;
    telefono?: string;
    proyecto?: string;
    resumenConversacion?: string; // Resumen generado por IA
    confirmSendEmail?: boolean; // NUEVO: Usuario confirmó envío de email
  };
  conversacion: string[];
  startedAt?: Date;
}
