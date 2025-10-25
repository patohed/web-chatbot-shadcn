// Service para manejar el flujo conversacional de captura de leads
import { LeadFlowState, LeadFlowStep } from '@/types/lead-flow';

export class LeadFlowService {
  
  // Detectar si el usuario muestra intención de compra
  detectPurchaseIntent(message: string, conversationContext: string[]): boolean {
    const messageLower = message.toLowerCase().trim();
    
    // Palabras que NO deben activar el flujo (afirmaciones genéricas)
    const genericAffirmations = ['si', 'ok', 'dale', 'genial', 'perfecto', 'excelente'];
    if (genericAffirmations.includes(messageLower)) {
      // Solo activar si hay contexto previo de interés
      const hasContextualIntent = conversationContext.some(msg => {
        const msgLower = msg.toLowerCase();
        return msgLower.includes('contratar') || 
               msgLower.includes('presupuesto') || 
               msgLower.includes('agendar') ||
               msgLower.includes('cita') ||
               msgLower.includes('reunión');
      });
      
      if (!hasContextualIntent) return false;
    }

    // Frases explícitas de intención de compra
    const strongIntentKeywords = [
      'quiero contratar',
      'necesito contratar',
      'dame presupuesto',
      'cuánto cuesta',
      'cuanto sale',
      'quiero avanzar',
      'hagámoslo',
      'me interesa contratar',
      'quisiera contratar',
      'quiero agendar',
      'agendar una cita',
      'agendar reunión',
      'coordinemos',
      'cuando podemos',
    ];

    return strongIntentKeywords.some(keyword => messageLower.includes(keyword));
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
    // Buscar mensajes del usuario que contengan descripciones de proyecto
    const userMessages = conversacion
      .filter(msg => msg.startsWith('Cliente:'))
      .map(msg => msg.replace('Cliente:', '').trim());

    // Palabras clave que indican descripción de proyecto
    const projectKeywords = [
      'e-commerce', 'ecommerce', 'tienda', 'página web', 'web', 'aplicación',
      'app', 'sistema', 'plataforma', 'sitio', 'portal', 'dashboard',
      'chatbot', 'bot', 'automatización', 'integración', 'api'
    ];

    // Encontrar mensajes que mencionen proyectos
    const projectMessages = userMessages.filter(msg => {
      const msgLower = msg.toLowerCase();
      return projectKeywords.some(keyword => msgLower.includes(keyword)) && msg.length > 15;
    });

    if (projectMessages.length > 0) {
      return projectMessages.join(' | ');
    }

    // Si no encuentra nada específico, concatenar mensajes largos
    const longMessages = userMessages.filter(msg => msg.length > 20);
    return longMessages.length > 0 
      ? longMessages.join(' | ')
      : 'Proyecto de desarrollo web/software (detalles a confirmar)';
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
