// Service para manejar el flujo conversacional de captura de leads
import { LeadFlowState, LeadFlowStep } from '@/types/lead-flow';

export class LeadFlowService {
  
  // Detectar si el usuario muestra intención de compra
  detectPurchaseIntent(message: string): boolean {
    const intentKeywords = [
      'me interesa',
      'quiero contratar',
      'dame presupuesto',
      'cuánto cuesta',
      'cuanto sale',
      'necesito',
      'quiero avanzar',
      'haga',
      'dale',
      'si',
      'ok',
      'perfecto',
      'excelente'
    ];

    const messageLower = message.toLowerCase();
    return intentKeywords.some(keyword => messageLower.includes(keyword));
  }

  // Obtener la siguiente pregunta según el paso actual
  getNextQuestion(currentStep: LeadFlowStep, flowState: LeadFlowState): { step: LeadFlowStep; question: string } | null {
    switch (currentStep) {
      case 'detecting':
      case 'idle':
        return {
          step: 'asking_name',
          question: '¡Excelente! Para avanzar con tu proyecto necesito algunos datos. ¿Cuál es tu nombre completo?'
        };

      case 'asking_name':
        return {
          step: 'asking_email',
          question: `Perfecto, ${flowState.data.nombre}. ¿Cuál es tu email para enviarte la propuesta?`
        };

      case 'asking_email':
        return {
          step: 'asking_phone',
          question: '¿Tenés un teléfono donde pueda contactarte? (Podés saltear este paso si preferís)'
        };

      case 'asking_phone':
        // Si no hay descripción del proyecto aún, preguntar
        if (!flowState.data.proyecto || flowState.data.proyecto.length < 10) {
          return {
            step: 'asking_project',
            question: 'Genial. Ahora contame brevemente: ¿en qué consiste tu proyecto?'
          };
        }
        return null;

      case 'asking_project':
        return null; // Ya tenemos todo

      default:
        return null;
    }
  }

  // Validar email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Procesar respuesta del usuario y actualizar el estado
  processUserResponse(
    userMessage: string,
    currentFlowState: LeadFlowState
  ): { 
    newState: LeadFlowState; 
    botResponse: string | null; 
    shouldSendLead: boolean;
    validationError?: string;
  } {
    const newState = { ...currentFlowState };
    let botResponse: string | null = null;
    let shouldSendLead = false;
    let validationError: string | undefined;

    switch (currentFlowState.step) {
      case 'asking_name':
        // Guardar nombre
        const nombre = userMessage.trim();
        if (nombre.length < 2) {
          validationError = 'Por favor, ingresá un nombre válido.';
          break;
        }
        newState.data.nombre = nombre;
        
        // Siguiente pregunta
        const nextAfterName = this.getNextQuestion('asking_name', newState);
        if (nextAfterName) {
          newState.step = nextAfterName.step;
          botResponse = nextAfterName.question;
        }
        break;

      case 'asking_email':
        // Validar y guardar email
        const email = userMessage.trim().toLowerCase();
        if (!this.isValidEmail(email)) {
          validationError = 'Ese email no parece válido. ¿Podés verificarlo?';
          break;
        }
        newState.data.email = email;
        
        // Siguiente pregunta
        const nextAfterEmail = this.getNextQuestion('asking_email', newState);
        if (nextAfterEmail) {
          newState.step = nextAfterEmail.step;
          botResponse = nextAfterEmail.question;
        }
        break;

      case 'asking_phone':
        // Teléfono es opcional
        const userResponseLower = userMessage.toLowerCase();
        
        if (
          userResponseLower.includes('no') ||
          userResponseLower.includes('skip') ||
          userResponseLower.includes('saltar') ||
          userResponseLower.includes('pasar')
        ) {
          // Usuario no quiere dar teléfono
          newState.data.telefono = undefined;
        } else {
          // Guardar teléfono
          newState.data.telefono = userMessage.trim();
        }
        
        // Siguiente pregunta
        const nextAfterPhone = this.getNextQuestion('asking_phone', newState);
        if (nextAfterPhone) {
          newState.step = nextAfterPhone.step;
          botResponse = nextAfterPhone.question;
        } else {
          // Ya tenemos todo, enviar lead
          newState.step = 'completed';
          botResponse = '¡Perfecto! Ya tengo toda la información. Me voy a contactar con vos a la brevedad para avanzar con tu proyecto. ¡Muchas gracias por tu confianza! 🚀';
          shouldSendLead = true;
        }
        break;

      case 'asking_project':
        // Guardar descripción del proyecto
        const proyecto = userMessage.trim();
        if (proyecto.length < 10) {
          validationError = 'Por favor, dame un poco más de detalle sobre tu proyecto.';
          break;
        }
        newState.data.proyecto = proyecto;
        
        // Ya tenemos todo, enviar lead
        newState.step = 'completed';
        botResponse = '¡Perfecto! Ya tengo toda la información. Me voy a contactar con vos a la brevedad para avanzar con tu proyecto. ¡Muchas gracias por tu confianza! 🚀';
        shouldSendLead = true;
        break;

      default:
        break;
    }

    return { 
      newState, 
      botResponse, 
      shouldSendLead,
      validationError 
    };
  }

  // Extraer descripción del proyecto de mensajes anteriores
  extractProjectDescription(conversacion: string[]): string {
    // Buscar mensajes del usuario que contengan descripciones
    const userMessages = conversacion
      .filter(msg => msg.startsWith('Cliente:'))
      .map(msg => msg.replace('Cliente:', '').trim());

    // Concatenar mensajes largos (más de 20 caracteres)
    const descriptions = userMessages
      .filter(msg => msg.length > 20)
      .join(' | ');

    return descriptions || 'Sin descripción específica';
  }

  // Crear estado inicial del flujo
  createInitialState(): LeadFlowState {
    return {
      step: 'idle',
      data: {},
      conversacion: [],
    };
  }
}
