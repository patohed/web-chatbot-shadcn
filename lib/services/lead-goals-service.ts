/**
 * Service para gestionar goals del flujo de captura de leads
 * Arquitectura: Cada dato es un "goal" que debe completarse
 * Solo cuando TODOS los goals están completos se activa el envío de email
 */

import { LeadFlowState } from '@/types/lead-flow';

export interface GoalStatus {
  nombre: boolean;
  email: boolean;
  proyecto: boolean;
  telefono: boolean;
}

export interface LeadGoalsResult {
  allGoalsCompleted: boolean;
  missingGoals: string[];
  completedGoals: string[];
  progress: number; // 0-100%
}

export class LeadGoalsService {
  
  /**
   * Define qué goals son obligatorios vs opcionales
   */
  private readonly REQUIRED_GOALS = ['nombre', 'email', 'proyecto'];
  private readonly OPTIONAL_GOALS = ['telefono'];
  
  /**
   * Evalúa el estado actual de los goals
   */
  evaluateGoals(flowState: LeadFlowState): LeadGoalsResult {
    const { nombre, email, proyecto, telefono } = flowState.data;
    
    // Mapeo de goals completados
    const goalStatus: GoalStatus = {
      nombre: !!nombre && nombre.trim().length >= 2,
      email: !!email && this.isValidEmail(email),
      proyecto: !!proyecto && proyecto.trim().length >= 10,
      telefono: !!telefono && telefono.trim().length > 0, // Opcional
    };
    
    // Identificar goals faltantes (solo los requeridos)
    const missingGoals = this.REQUIRED_GOALS.filter(
      goal => !goalStatus[goal as keyof GoalStatus]
    );
    
    // Identificar goals completados
    const completedGoals = Object.keys(goalStatus).filter(
      goal => goalStatus[goal as keyof GoalStatus]
    );
    
    // Todos los REQUERIDOS completados?
    const allGoalsCompleted = missingGoals.length === 0;
    
    // Calcular progreso (incluyendo opcionales para UX)
    const totalGoals = this.REQUIRED_GOALS.length + this.OPTIONAL_GOALS.length;
    const progress = Math.round((completedGoals.length / totalGoals) * 100);
    
    return {
      allGoalsCompleted,
      missingGoals,
      completedGoals,
      progress,
    };
  }
  
  /**
   * Verifica si se puede enviar el lead (todos los goals obligatorios completos)
   */
  canSendLead(flowState: LeadFlowState): boolean {
    const result = this.evaluateGoals(flowState);
    return result.allGoalsCompleted;
  }
  
  /**
   * Obtiene el siguiente goal que falta
   */
  getNextMissingGoal(flowState: LeadFlowState): string | null {
    const result = this.evaluateGoals(flowState);
    
    if (result.allGoalsCompleted) {
      return null;
    }
    
    // Retornar el primer goal faltante en orden de prioridad
    const priorityOrder = ['nombre', 'email', 'proyecto', 'telefono'];
    
    for (const goal of priorityOrder) {
      if (result.missingGoals.includes(goal)) {
        return goal;
      }
    }
    
    return null;
  }
  
  /**
   * Valida un goal específico
   */
  validateGoal(goalName: string, value: string): { valid: boolean; error?: string } {
    switch (goalName) {
      case 'nombre':
        if (!value || value.trim().length < 2) {
          return { valid: false, error: 'Por favor, ingresá un nombre válido (mínimo 2 caracteres).' };
        }
        return { valid: true };
        
      case 'email':
        if (!value || !this.isValidEmail(value)) {
          return { valid: false, error: 'Ese email no parece válido. ¿Podés verificarlo?' };
        }
        return { valid: true };
        
      case 'proyecto':
        if (!value || value.trim().length < 10) {
          return { valid: false, error: 'Por favor, dame un poco más de detalle sobre tu proyecto (mínimo 10 caracteres).' };
        }
        return { valid: true };
        
      case 'telefono':
        // Teléfono es opcional, siempre válido
        return { valid: true };
        
      default:
        return { valid: false, error: 'Goal desconocido' };
    }
  }
  
  /**
   * Genera reporte de debug del estado de goals
   */
  debugGoals(flowState: LeadFlowState): string {
    const result = this.evaluateGoals(flowState);
    
    return `
📊 Estado de Goals:
✅ Completados: ${result.completedGoals.join(', ') || 'ninguno'}
❌ Faltantes: ${result.missingGoals.join(', ') || 'ninguno'}
📈 Progreso: ${result.progress}%
🎯 ¿Listo para enviar?: ${result.allGoalsCompleted ? 'SÍ ✅' : 'NO ❌'}
    `.trim();
  }
  
  /**
   * Validación de email (helper privado)
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
}
