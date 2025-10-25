/**
 * 🎯 CLOSE SALE ORCHESTRATOR
 * Clean Architecture - Uncle Bob
 * 
 * Orquesta el flujo completo de cierre de venta:
 * 1. Detección de disparador
 * 2. Activación de arquitectura de goals
 * 3. Validación de condición de goals completados
 * 4. Envío de email
 * 
 * Principios:
 * - Single Responsibility: Solo orquesta el flujo de cierre
 * - Dependency Injection: Recibe servicios como dependencias
 * - Early Returns: Sale rápido en caso de error
 * - Clean Async/Await: Sin promises anidadas
 */

import { LeadFlowService } from '../services/lead-flow-service';
import { LeadGoalsService } from '../services/lead-goals-service';
import { generateConversationSummary } from '../actions/generate-conversation-summary';
import { LeadFlowState } from '@/types/lead-flow';
import { Message } from '@/types/domain';

export interface CloseSaleResult {
  success: boolean;
  newState: LeadFlowState;
  botMessage?: Message;
  shouldUpdateUI: boolean;
  shouldSendLead: boolean; // NUEVO: Flag para indicar si enviar lead ahora
  error?: string;
}

export interface TriggerDetectionResult {
  triggered: boolean;
  initialState?: LeadFlowState;
  initialMessage?: Message;
  conversationSummary?: string; // Resumen generado al activar flujo
}

export class CloseSaleOrchestrator {
  private leadFlowService: LeadFlowService;
  private goalsService: LeadGoalsService;

  constructor(
    leadFlowService: LeadFlowService,
    goalsService: LeadGoalsService
  ) {
    this.leadFlowService = leadFlowService;
    this.goalsService = goalsService;
  }

  /**
   * PASO 1: Detectar disparador de intención de cierre
   * Early return si no hay intención
   * Genera RESUMEN DE CONVERSACIÓN automáticamente al activar flujo
   */
  async detectTrigger(
    userMessage: string,
    conversationContext: string[],
    currentState: LeadFlowState,
    fullMessages: Message[] // Nueva: mensajes completos para resumir
  ): Promise<TriggerDetectionResult> {
    console.log('\n' + '⭐'.repeat(30));
    console.log('🎯 [ORCHESTRATOR] PASO 1: Detectando disparador...');
    console.log('💬 [ORCHESTRATOR] Mensaje usuario:', userMessage);
    console.log('📊 [ORCHESTRATOR] Estado actual:', currentState.step);
    console.log('⭐'.repeat(30) + '\n');
    
    // Early return si ya está en flujo activo
    if (currentState.step !== 'idle') {
      console.log('⏭️  [ORCHESTRATOR] Flujo ya activo, skip detección');
      return { triggered: false };
    }

    // Detectar intención
    const hasIntent = this.leadFlowService.detectPurchaseIntent(
      userMessage,
      conversationContext
    );

    // Early return si no hay intención
    if (!hasIntent) {
      console.log('❌ [ORCHESTRATOR] No se detectó intención de cierre');
      return { triggered: false };
    }

    console.log('✅ [ORCHESTRATOR] Disparador detectado - Solicitando confirmación');

    // ========================================
    // NUEVO: Ir a pending_confirmation en vez de asking_name
    // ========================================
    console.log('❓ [ORCHESTRATOR] Preguntando si el usuario quiere coordinar...');

    // Crear estado de confirmación pendiente
    const confirmationState: LeadFlowState = {
      step: 'pending_confirmation',
      data: {},
      conversacion: conversationContext,
      startedAt: new Date(),
    };

    const confirmationMessage: Message = {
      role: 'assistant',
      content: '¿Querés que coordinemos una reunión para darte información personalizada sobre tu proyecto? 📅',
      timestamp: new Date(),
    };

    console.log('✅ [ORCHESTRATOR] Estado de confirmación creado');

    return {
      triggered: true,
      initialState: confirmationState,
      initialMessage: confirmationMessage,
      conversationSummary: undefined, // No generamos resumen hasta confirmar
    };
  }

  /**
   * PASO 2-3: Procesar respuesta del usuario y validar goals
   * Maneja la arquitectura de goals + validación
   */
  async processGoalResponse(
    userMessage: string,
    currentState: LeadFlowState,
    fullMessages?: Message[] // NUEVO: Para generar resumen después de confirmar
  ): Promise<CloseSaleResult> {
    console.log('🎯 [ORCHESTRATOR] PASO 2-3: Procesando respuesta y validando goals...');
    console.log('📊 [ORCHESTRATOR] Estado actual:', this.goalsService.debugGoals(currentState));

    // Procesar respuesta con LeadFlowService
    const {
      newState,
      botResponse,
      shouldSendLead,
      validationError,
    } = this.leadFlowService.processUserResponse(userMessage, currentState);

    // ========================================
    // NUEVO: Si usuario confirmó (pending_confirmation → asking_name), generar resumen
    // ========================================
    if (
      currentState.step === 'pending_confirmation' && 
      newState.step === 'asking_name' &&
      newState.data.userWantsToSchedule === true &&
      fullMessages
    ) {
      console.log('📝 [ORCHESTRATOR] Usuario confirmó - Generando resumen con IA...');
      
      try {
        const summary = await generateConversationSummary(fullMessages);
        
        if (summary) {
          newState.data.resumenConversacion = summary;
          console.log('✅ [ORCHESTRATOR] Resumen generado exitosamente');
          console.log('📝 [ORCHESTRATOR] Preview:', summary.substring(0, 100) + '...');
        } else {
          console.log('⚠️ [ORCHESTRATOR] No se pudo generar resumen');
        }
      } catch (error) {
        console.error('❌ [ORCHESTRATOR] Error al generar resumen:', error);
      }

      // Extraer contexto del proyecto
      const proyectoContext = this.leadFlowService.extractProjectDescription(currentState.conversacion);
      if (proyectoContext) {
        newState.data.proyecto = proyectoContext;
        console.log('📝 [ORCHESTRATOR] Contexto del proyecto extraído');
      }
    }

    // Early return si hay error de validación
    if (validationError) {
      console.log('⚠️ [ORCHESTRATOR] Error de validación:', validationError);
      return {
        success: false,
        newState: currentState, // No cambiar estado si hay error
        botMessage: {
          role: 'assistant',
          content: validationError,
          timestamp: new Date(),
        },
        shouldUpdateUI: true,
        shouldSendLead: false,
        error: validationError,
      };
    }

    // Verificar si los goals están completos
    console.log('📊 [ORCHESTRATOR] Estado nuevo:', this.goalsService.debugGoals(newState));

    // Early return si no hay respuesta del bot (no debería pasar)
    if (!botResponse) {
      console.error('⚠️ [ORCHESTRATOR] Error: No hay respuesta del bot');
      return {
        success: false,
        newState,
        shouldUpdateUI: false,
        shouldSendLead: false,
        error: 'Error interno: No hay respuesta',
      };
    }

    // Crear mensaje del bot
    const botMessage: Message = {
      role: 'assistant',
      content: botResponse,
      timestamp: new Date(),
    };

    // PASO 4: Si todos los goals están completos, enviar email
    if (shouldSendLead) {
      console.log('🎯 [ORCHESTRATOR] PASO 4: TODOS LOS GOALS COMPLETADOS');
      console.log('📧 [ORCHESTRATOR] Preparando envío de email...');
      
      // El envío del email se maneja en el componente para no bloquear UI
      // Retornamos el estado listo para enviar
      return {
        success: true,
        newState,
        botMessage,
        shouldUpdateUI: true,
        shouldSendLead: true,
      };
    }

    // Goals aún no completos, continuar con el flujo
    console.log('⏭️  [ORCHESTRATOR] Goals incompletos, continuando flujo...');
    
    return {
      success: true,
      newState,
      botMessage,
      shouldUpdateUI: true,
      shouldSendLead: false,
    };
  }

  /**
   * PASO 4: Enviar lead al API (separado para clean async/await)
   * Esta función NO se ejecuta aquí, se llama desde el componente
   * para evitar bloqueo de UI y mantener responsabilidades separadas
   */
  async sendLeadToAPI(
    flowState: LeadFlowState,
    apiEndpoint: string = '/api/lead'
  ): Promise<{ success: boolean; leadId?: string; error?: string }> {
    console.log('📧 [ORCHESTRATOR] PASO 4: Enviando lead al API...');

    const { nombre, email, telefono, proyecto, resumenConversacion } = flowState.data;

    // Validación final (doble check)
    if (!nombre || !email || !proyecto) {
      const error = 'Datos incompletos para enviar lead';
      console.error('❌ [ORCHESTRATOR]', error, {
        nombre: !!nombre,
        email: !!email,
        proyecto: !!proyecto,
      });
      return { success: false, error };
    }

    console.log('📧 [ORCHESTRATOR] Datos validados, llamando a API...');
    console.log('📝 [ORCHESTRATOR] Resumen incluido:', !!resumenConversacion);

    const payload = {
      nombre,
      email,
      telefono,
      proyecto,
      conversacion: flowState.conversacion,
      resumenConversacion, // NUEVO: Incluir resumen en el payload
    };

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📧 [ORCHESTRATOR] Respuesta:', response.status, response.statusText);

      // Early return si hay error HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Error desconocido del servidor',
        }));
        console.error('❌ [ORCHESTRATOR] Error de API:', errorData);
        return { success: false, error: errorData.error };
      }

      const result = await response.json();
      console.log('✅ [ORCHESTRATOR] Lead enviado exitosamente:', result.leadId);

      return {
        success: true,
        leadId: result.leadId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ [ORCHESTRATOR] Exception:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Verificar si puede enviar lead (wrapper público)
   */
  canSendLead(flowState: LeadFlowState): boolean {
    return this.goalsService.canSendLead(flowState);
  }

  /**
   * Debug del estado de goals (wrapper público)
   */
  debugGoals(flowState: LeadFlowState): string {
    return this.goalsService.debugGoals(flowState);
  }
}
