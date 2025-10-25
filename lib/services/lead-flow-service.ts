// Service para manejar el flujo conversacional de captura de leads
import { LeadFlowState, LeadFlowStep } from '@/types/lead-flow';
import { LeadGoalsService } from './lead-goals-service';

export class LeadFlowService {
  private goalsService: LeadGoalsService;
  
  constructor() {
    this.goalsService = new LeadGoalsService();
  }
  
  // Detectar si el usuario muestra intención de compra
  detectPurchaseIntent(message: string, conversationContext: string[]): boolean {
    const messageLower = message.toLowerCase().trim();
    
    console.log('🔍 [INTENT-DETECTION] Analizando mensaje:', messageLower);
    console.log('🔍 [INTENT-DETECTION] Contexto conversación:', conversationContext.slice(-3)); // últimos 3 mensajes
    
    // Frases explícitas de intención de compra (PRIORIDAD ALTA)
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
      'agendar reunion', // sin tilde
      'coordinemos',
      'cuando podemos',
      'vamos a avanzar',
      'quiero empezar',
      'tener una reunión',
      'tener una reunion', // sin tilde
      'me gustaría tener una reunión',
      'me gustaria tener una reunion', // sin tildes
      'me gustaria tener una reunión', // mixed
      'quiero una reunión',
      'quiero una reunion', // sin tilde
      'necesito una reunión',
      'necesito una reunion', // sin tilde
      'podemos reunirnos',
      'nos reunimos',
      'charlamos',
      'hablamos',
      'conversamos',
    ];

    // Verificar frases explícitas primero
    const hasStrongIntent = strongIntentKeywords.some(keyword => messageLower.includes(keyword));
    if (hasStrongIntent) {
      console.log('✅ [INTENT-DETECTION] STRONG INTENT detectado:', messageLower);
      return true;
    }
    
    // Afirmaciones genéricas que podrían indicar intención SI hay contexto
    const genericAffirmations = ['si', 'sí', 'ok', 'dale', 'genial', 'perfecto', 'excelente'];
    const isGenericAffirmation = genericAffirmations.some(word => {
      // Buscar palabra exacta o con espacios alrededor
      return messageLower === word || 
             messageLower.includes(' ' + word + ' ') ||
             messageLower.startsWith(word + ' ') ||
             messageLower.endsWith(' ' + word);
    });
    
    if (isGenericAffirmation) {
      console.log('🟡 [INTENT-DETECTION] Afirmación genérica detectada, verificando contexto...');
      
      // Buscar contexto previo que indique que el bot ofreció agendar/contratar
      const hasContextualIntent = conversationContext.some(msg => {
        const msgLower = msg.toLowerCase();
        return msgLower.includes('agendar') ||
               msgLower.includes('llamada') ||
               msgLower.includes('coordinar') ||
               msgLower.includes('avanzar') ||
               msgLower.includes('contratar') || 
               msgLower.includes('presupuesto') || 
               msgLower.includes('cita') ||
               msgLower.includes('reunión') ||
               msgLower.includes('siguiente paso') ||
               msgLower.includes('próximo paso');
      });
      
      if (hasContextualIntent) {
        console.log('✅ [INTENT-DETECTION] Contexto positivo encontrado → ACTIVAR FLUJO');
        return true;
      } else {
        console.log('❌ [INTENT-DETECTION] No hay contexto suficiente → NO activar flujo');
        return false;
      }
    }

    console.log('❌ [INTENT-DETECTION] No se detectó intención de compra');
    return false;
  }

  // Obtener la siguiente pregunta según el paso actual
  getNextQuestion(currentStep: LeadFlowStep, flowState: LeadFlowState): { step: LeadFlowStep; question: string } | null {
    switch (currentStep) {
      case 'detecting':
      case 'idle':
        // Ya no se usa - ahora idle va a pending_confirmation
        return null;

      case 'pending_confirmation':
        // Usuario confirmó que quiere coordinar → preguntar nombre
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
        // SIEMPRE preguntar por proyecto después del teléfono
        return {
          step: 'asking_project',
          question: 'Genial. Ahora contame brevemente: ¿en qué consiste tu proyecto?'
        };

      case 'asking_project':
        // Después de proyecto, pedir confirmación
        return {
          step: 'confirm_send',
          question: `Perfecto, ${flowState.data.nombre}. Ya tengo tu información. ¿Está completa tu consulta o hay algo más que quieras agregar?`
        };

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

    console.log('\n' + '='.repeat(60));
    console.log('🎯 [LEAD-FLOW] Procesando step:', currentFlowState.step);
    console.log('🎯 [LEAD-FLOW] Mensaje usuario:', userMessage.substring(0, 50));
    console.log('🎯 [LEAD-FLOW] Estado actual:', this.goalsService.debugGoals(currentFlowState));
    console.log('='.repeat(60) + '\n');

    switch (currentFlowState.step) {
      case 'pending_confirmation':
        // NUEVO: Usuario confirmando si quiere agendar
        const userResponseConfirmation = userMessage.toLowerCase().trim();
        
        if (
          userResponseConfirmation.includes('si') ||
          userResponseConfirmation.includes('sí') ||
          userResponseConfirmation.includes('dale') ||
          userResponseConfirmation.includes('ok') ||
          userResponseConfirmation.includes('perfecto') ||
          userResponseConfirmation.includes('genial') ||
          userResponseConfirmation.includes('excelente')
        ) {
          console.log('✅ [CONFIRMACIÓN] Usuario ACEPTÓ coordinar - Activando flujo completo');
          newState.data.userWantsToSchedule = true;
          
          // Ahora sí pasar a asking_name
          const nextQuestion = this.getNextQuestion('pending_confirmation', newState);
          if (nextQuestion) {
            newState.step = nextQuestion.step;
            botResponse = nextQuestion.question;
          }
        } else if (
          userResponseConfirmation.includes('no') ||
          userResponseConfirmation.includes('nop') ||
          userResponseConfirmation.includes('tampoco') ||
          userResponseConfirmation.includes('ahora no')
        ) {
          console.log('❌ [CONFIRMACIÓN] Usuario RECHAZÓ coordinar - Cancelando flujo');
          newState.step = 'idle';
          newState.data.userWantsToSchedule = false;
          botResponse = '¡Perfecto! Cualquier cosa que necesites, acá estoy para ayudarte. 😊';
        } else {
          // Respuesta ambigua, pedir clarificación
          console.log('❓ [CONFIRMACIÓN] Respuesta ambigua - Solicitando clarificación');
          botResponse = 'Disculpá, ¿es un sí o un no? ¿Querés que coordinemos la reunión? 📅';
        }
        break;

      case 'asking_name':
        // Validar goal: nombre
        const nombreValidation = this.goalsService.validateGoal('nombre', userMessage.trim());
        if (!nombreValidation.valid) {
          validationError = nombreValidation.error;
          break;
        }
        
        newState.data.nombre = userMessage.trim();
        console.log('✅ [GOAL COMPLETADO] Nombre:', newState.data.nombre);
        
        // Siguiente pregunta
        const nextAfterName = this.getNextQuestion('asking_name', newState);
        if (nextAfterName) {
          newState.step = nextAfterName.step;
          botResponse = nextAfterName.question;
        }
        break;

      case 'asking_email':
        // Validar goal: email
        const emailValidation = this.goalsService.validateGoal('email', userMessage.trim());
        if (!emailValidation.valid) {
          validationError = emailValidation.error;
          break;
        }
        
        newState.data.email = userMessage.trim().toLowerCase();
        console.log('✅ [GOAL COMPLETADO] Email:', newState.data.email);
        
        // Siguiente pregunta
        const nextAfterEmail = this.getNextQuestion('asking_email', newState);
        if (nextAfterEmail) {
          newState.step = nextAfterEmail.step;
          botResponse = nextAfterEmail.question;
        }
        break;

      case 'asking_phone':
        // Goal opcional: teléfono
        const userResponseLower = userMessage.toLowerCase();
        
        if (
          userResponseLower.includes('no') ||
          userResponseLower.includes('skip') ||
          userResponseLower.includes('saltar') ||
          userResponseLower.includes('pasar')
        ) {
          console.log('⏭️  [GOAL SKIPPED] Teléfono: usuario optó por saltear');
          newState.data.telefono = undefined;
        } else {
          newState.data.telefono = userMessage.trim();
          console.log('✅ [GOAL COMPLETADO] Teléfono:', newState.data.telefono);
        }
        
        // SIEMPRE pasar a asking_project (no verificar goals aún)
        const nextAfterPhone = this.getNextQuestion('asking_phone', newState);
        if (nextAfterPhone) {
          newState.step = nextAfterPhone.step;
          botResponse = nextAfterPhone.question;
          console.log('⏭️  [FLOW] Pasando a solicitar descripción del proyecto');
        }
        break;

      case 'asking_project':
        // Validar goal: proyecto
        const proyectoValidation = this.goalsService.validateGoal('proyecto', userMessage.trim());
        if (!proyectoValidation.valid) {
          validationError = proyectoValidation.error;
          break;
        }
        
        newState.data.proyecto = userMessage.trim();
        console.log('✅ [GOAL COMPLETADO] Proyecto:', newState.data.proyecto);
        
        // Verificar que todos los goals obligatorios estén completos
        if (this.goalsService.canSendLead(newState)) {
          // ✅ GOALS COMPLETOS - Pasar a CONFIRMACIÓN
          const nextQuestion = this.getNextQuestion('asking_project', newState);
          if (nextQuestion) {
            newState.step = nextQuestion.step;
            botResponse = nextQuestion.question;
            shouldSendLead = false; // NO enviar aún, esperar confirmación
            console.log('🎯 [GOALS] ✅ TODOS LOS GOALS COMPLETADOS - Pasando a confirmación');
            console.log('🎯 [GOALS] Estado:', this.goalsService.debugGoals(newState));
          }
        } else {
          // Esto no debería pasar, pero por seguridad
          const missingGoal = this.goalsService.getNextMissingGoal(newState);
          console.error('⚠️ [GOALS] Falta goal después de proyecto:', missingGoal);
        }
        break;

      case 'confirm_send':
        // Procesar confirmación del usuario (si/no)
        const confirmLower = userMessage.toLowerCase().trim();
        
        // Detección de SÍ (consulta completa)
        const isYes = (
          confirmLower === 'si' ||
          confirmLower === 'sí' ||
          confirmLower === 'yes' ||
          confirmLower === 'ok' ||
          confirmLower === 'dale' ||
          confirmLower === 'perfecto' ||
          confirmLower === 'excelente' ||
          confirmLower === 'completa' ||
          confirmLower === 'está completa' ||
          confirmLower === 'esta completa' ||
          confirmLower === 'por supuesto' ||
          confirmLower.includes('sí') ||
          confirmLower.includes('si,') ||
          confirmLower.includes('completa')
        );
        
        // Detección de NO (quiere agregar más)
        const isNo = (
          confirmLower === 'no' ||
          confirmLower === 'nope' ||
          confirmLower === 'negativo' ||
          confirmLower === 'falta' ||
          confirmLower === 'incompleta' ||
          confirmLower.includes('no está completa') ||
          confirmLower.includes('no esta completa') ||
          confirmLower.includes('no,') ||
          confirmLower.includes('quiero agregar') ||
          confirmLower.includes('falta algo') ||
          confirmLower.includes('hay más')
        );
        
        if (isYes) {
          // Usuario confirmó que está completa - ENVIAR EMAIL
          newState.data.confirmSendEmail = true;
          newState.step = 'completed';
          botResponse = '¡Perfecto, ' + newState.data.nombre + '! Te envío el email ahora mismo con todos los detalles. Me voy a contactar con vos a la brevedad. ¡Muchas gracias por tu confianza! 🚀';
          shouldSendLead = true;
          console.log('✅ [CONFIRMACIÓN] Usuario confirmó (consulta completa) - ENVIANDO EMAIL');
          console.log('📧 [SEND] Preparando envío a:', newState.data.email);
        } else if (isNo) {
          // Usuario quiere agregar más - VOLVER A FLUJO CONVERSACIONAL
          newState.data.confirmSendEmail = false;
          newState.step = 'idle'; // Volver a flujo normal
          botResponse = 'Perfecto, contame qué más querés agregar o consultar. Estoy acá para ayudarte.';
          shouldSendLead = false;
          console.log('❌ [CONFIRMACIÓN] Usuario quiere agregar más - Volviendo a flujo conversacional');
          console.log('💬 [FLOW] Estado vuelve a idle para continuar conversación');
        } else {
          // Respuesta ambigua - volver a preguntar
          validationError = 'Por favor respondé "si" si está completa tu consulta, o "no" si querés agregar algo más.';
          console.log('⚠️ [CONFIRMACIÓN] Respuesta ambigua, solicitando clarificación');
        }
        break;

      default:
        break;
    }

    console.log('\n' + '-'.repeat(60));
    console.log('🏁 [LEAD-FLOW] RESULTADO:');
    console.log('  ➡️ Nuevo step:', newState.step);
    console.log('  ➡️ Bot response:', botResponse ? botResponse.substring(0, 80) + '...' : '(null)');
    console.log('  ➡️ shouldSendLead:', shouldSendLead);
    console.log('  ➡️ validationError:', validationError || '(ninguno)');
    console.log('  ➡️ Estado goals:', this.goalsService.debugGoals(newState));
    console.log('-'.repeat(60) + '\n');

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
