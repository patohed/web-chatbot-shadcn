"use client"

import { useState, useRef, useEffect } from "react";
import Mensaje from "./mensaje";
import ChatForm from "./chat-form";
import { BotIcon } from "lucide-react";
import { Message } from "@/types/domain";
import { LeadFlowState } from "@/types/lead-flow";
import { LeadFlowService } from "@/lib/services/lead-flow-service";
import { LeadGoalsService } from "@/lib/services/lead-goals-service";
import { CloseSaleOrchestrator } from "@/lib/orchestrators/close-sale-orchestrator";

export default function Chatbox() {
  const [chatHistoria, setChatHistoria] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [leadFlowState, setLeadFlowState] = useState<LeadFlowState>({
    step: 'idle',
    data: {},
    conversacion: [],
  });
  
  // Servicios - Dependency Injection
  const leadFlowService = useRef(new LeadFlowService());
  const goalsService = useRef(new LeadGoalsService());
  const closeSaleOrchestrator = useRef(
    new CloseSaleOrchestrator(
      leadFlowService.current,
      goalsService.current
    )
  );
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistoria, isLoading]);

  // ===================================================================
  // CLEAN ASYNC/AWAIT - Uncle Bob Clean Architecture
  // Usando CloseSaleOrchestrator para manejar TODO el flujo de cierre
  // ===================================================================

  /**
   * Handler principal de mensajes del usuario
   * Coordina usando el orchestrator para el flujo de cierre
   */
  const handleUserMessage = async (content: string): Promise<void> => {
    console.log('\n='.repeat(50));
    console.log('📥 [CHATBOX] NUEVO MENSAJE DEL USUARIO:', content);
    console.log('📊 [CHATBOX] Estado actual del flujo:', leadFlowState.step);
    console.log('📊 [CHATBOX] Datos capturados:', {
      nombre: leadFlowState.data.nombre || '(vacío)',
      email: leadFlowState.data.email || '(vacío)',
      telefono: leadFlowState.data.telefono || '(vacío)',
      proyecto: leadFlowState.data.proyecto ? leadFlowState.data.proyecto.substring(0, 30) + '...' : '(vacío)',
    });
    console.log('='.repeat(50) + '\n');
    
    try {
      // Agregar mensaje del usuario al chat
      const userMessage: Message = {
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setError("");
      setChatHistoria(prev => [...prev, userMessage]);

      // Actualizar conversación
      const updatedConversacion = [
        ...leadFlowState.conversacion,
        `Cliente: ${content}`
      ];

      setLeadFlowState(prev => ({
        ...prev,
        conversacion: updatedConversacion,
      }));

      console.log('🔍 [CHATBOX] Mensaje del usuario:', content);
      console.log('🔍 [CHATBOX] Estado del flujo:', leadFlowState.step);

      // ============================================================
      // FLUJO DE CIERRE - Usando Orchestrator (Clean Architecture)
      // ============================================================

      // CASO 1: Flujo activo de captura de leads (cualquier step que NO sea idle)
      if (leadFlowState.step !== 'idle') {
        // Si está completed, verificar si ya pasaron 5 minutos para permitir reset
        if (leadFlowState.step === 'completed' && leadFlowState.completedAt) {
          const minutesSinceCompletion = (Date.now() - leadFlowState.completedAt.getTime()) / 1000 / 60;
          if (minutesSinceCompletion >= 5) {
            console.log('🔄 [CHATBOX] Flujo completado hace más de 5 min - Permitiendo detectar nuevos triggers');
            // Reset a idle y continuar con detección normal
            setLeadFlowState({
              step: 'idle',
              data: {},
              conversacion: [],
            });
          } else {
            console.log('⏸️  [CHATBOX] Flujo completado recientemente - Ignorando triggers por', (5 - minutesSinceCompletion).toFixed(1), 'minutos más');
            // Responder con IA normal, sin detectar triggers
            await handleAIResponse(content);
            return;
          }
        } else {
          // Flujo activo normal (pending_confirmation, asking_name, asking_email, etc.)
          console.log('✅ [CHATBOX] FLUJO DE CIERRE ACTIVO - Procesando con orchestrator (NO IA)');
          await handleActiveCloseSaleFlow(content, updatedConversacion);
          return;
        }
      } else {
        console.log('🔵 [CHATBOX] Flujo en estado idle - Buscando triggers');
      }

      // CASO 2: Detectar disparador de intención de cierre (SOLO cuando step === 'idle')
      if (leadFlowState.step === 'idle') {
        // 🎨 EFECTO "ESCRIBIENDO" antes de activar flujo
        await showTypingIndicator(1000);
        
        const triggerResult = await closeSaleOrchestrator.current.detectTrigger(
          content,
          updatedConversacion,
          leadFlowState,
          chatHistoria // NUEVO: Pasar mensajes completos para generar resumen
        );

        // Si se detectó disparador, activar flujo
        if (triggerResult.triggered && triggerResult.initialState && triggerResult.initialMessage) {
          console.log('🎯 [CHATBOX] Disparador detectado - Activando flujo de cierre');
          if (triggerResult.conversationSummary) {
            console.log('📝 [CHATBOX] Resumen de conversación generado');
          }
          setLeadFlowState(triggerResult.initialState);
          setChatHistoria(prev => [...prev, triggerResult.initialMessage!]);
          return;
        }
      }

      // CASO 3: Flujo normal con IA (sin intención de cierre)
      await handleAIResponse(content);
    } catch (error) {
      console.error('❌ [CHATBOX] Error en handleUserMessage:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  /**
   * Simula "escribiendo" antes de mostrar un mensaje automático
   * Mejora UX haciendo que el bot parezca más humano
   */
  const showTypingIndicator = async (durationMs: number = 1500): Promise<void> => {
    const typingMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    
    // Mostrar indicador "escribiendo..."
    setChatHistoria(prev => [...prev, typingMessage]);
    setIsLoading(true);
    
    // Esperar el tiempo especificado
    await new Promise(resolve => setTimeout(resolve, durationMs));
    
    // Remover indicador
    setChatHistoria(prev => prev.slice(0, -1));
    setIsLoading(false);
  };

  /**
   * Maneja el flujo activo de cierre usando el orchestrator
   * Clean async/await sin promises anidadas
   */
  const handleActiveCloseSaleFlow = async (
    content: string,
    conversacion: string[]
  ): Promise<void> => {
    console.log('\n' + '🔵'.repeat(30));
    console.log('🎯 [CHATBOX] Flujo de cierre activo - Procesando con orchestrator');
    console.log('💬 [CHATBOX] Usuario dijo:', content);
    console.log('📊 [CHATBOX] Step actual:', leadFlowState.step);
    console.log('🔵'.repeat(30) + '\n');

    // 🎨 EFECTO "ESCRIBIENDO" - Simular delay natural
    const messageLength = content.length;
    const typingDelay = Math.min(Math.max(messageLength * 20, 800), 2500); // Entre 800ms y 2500ms
    await showTypingIndicator(typingDelay);

    // Procesar respuesta usando orchestrator
    const result = await closeSaleOrchestrator.current.processGoalResponse(
      content,
      { ...leadFlowState, conversacion },
      chatHistoria // NUEVO: Pasar mensajes completos para generar resumen después de confirmar
    );

    console.log('\n📦 [CHATBOX] Resultado del orchestrator:');
    console.log('  success:', result.success);
    console.log('  newState.step:', result.newState.step);
    console.log('  shouldSendLead:', result.shouldSendLead);
    console.log('  botMessage:', result.botMessage?.content.substring(0, 80) + '...' || '(null)');
    console.log('  error:', result.error || '(ninguno)');
    console.log('');

    // Early return si hay error
    if (!result.success) {
      console.log('⚠️ [CHATBOX] Error en procesamiento:', result.error);
      if (result.botMessage) {
        setChatHistoria(prev => [...prev, result.botMessage!]);
      }
      return;
    }

    // Actualizar estado
    setLeadFlowState(result.newState);

    // Mostrar mensaje del bot
    if (result.botMessage && result.shouldUpdateUI) {
      setChatHistoria(prev => [...prev, result.botMessage!]);
      
      // IMPORTANTE: Guardar respuesta del bot en conversacion
      setLeadFlowState(prev => ({
        ...prev,
        conversacion: [
          ...prev.conversacion,
          `Bot: ${result.botMessage!.content}`
        ]
      }));
      console.log('💾 [CHATBOX] Respuesta del bot guardada en conversacion');
    }

    // Verificar si todos los goals están completos Y usuario confirmó
    const allGoalsCompleted = closeSaleOrchestrator.current.canSendLead(result.newState);
    const userConfirmed = result.newState.data.confirmSendEmail === true;

    console.log('🔍 [CHATBOX] Verificando condiciones de envío:', {
      step: result.newState.step,
      goalsCompleted: allGoalsCompleted,
      userConfirmed: userConfirmed,
      shouldSendFromService: result.shouldSendLead,
    });

    // Si todos los goals completos Y usuario confirmó, enviar lead
    if (allGoalsCompleted && userConfirmed && result.shouldSendLead) {
      console.log('🎯 [CHATBOX] ✅ CONDICIONES CUMPLIDAS - Enviando lead al API');
      console.log('📧 [CHATBOX] Datos a enviar:', {
        nombre: result.newState.data.nombre,
        email: result.newState.data.email,
        proyecto: result.newState.data.proyecto?.substring(0, 50) + '...',
        tieneResumen: !!result.newState.data.resumenConversacion,
      });
      await sendLeadViaOrchestrator(result.newState);
    } else if (result.newState.step === 'completed' && !userConfirmed) {
      console.log('❌ [CHATBOX] Usuario NO confirmó envío - email NO será enviado');
    }
  };

  /**
   * Envía lead usando el orchestrator
   * Manejo limpio de errores sin bloquear UI
   */
  const sendLeadViaOrchestrator = async (flowState: LeadFlowState): Promise<void> => {
    console.log('📧 [CHATBOX] Enviando lead al API vía orchestrator...');

    try {
      const result = await closeSaleOrchestrator.current.sendLeadToAPI(flowState);

      // Early return si hay error
      if (!result.success) {
        console.error('❌ [CHATBOX] Error al enviar lead:', result.error);
        const errorMsg: Message = {
          role: 'assistant',
          content: 'Guardé tu información pero hubo un problema al enviar la notificación. De todas formas me voy a contactar con vos.',
          timestamp: new Date(),
        };
        setChatHistoria(prev => [...prev, errorMsg]);
        return;
      }

      // Success!
      console.log('✅ [CHATBOX] Lead enviado exitosamente:', result.leadId);
      
      // IMPORTANTE: Marcar como completado con timestamp
      // Esto evita que se detecten triggers nuevamente en los próximos minutos
      console.log('🔄 [CHATBOX] Marcando flujo como completado con timestamp');
      setLeadFlowState(prev => ({
        ...prev,
        step: 'completed',
        completedAt: new Date(),
      }));
    } catch (error) {
      console.error('❌ [CHATBOX] Exception al enviar lead:', error);
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Hubo un problema técnico. Igualmente me voy a contactar con vos.',
        timestamp: new Date(),
      };
      setChatHistoria(prev => [...prev, errorMsg]);
    }
  };

  /**
   * Maneja respuesta de IA con streaming
   */
  const handleAIResponse = async (content: string): Promise<void> => {
    console.log('🤖 [IA] Enviando mensaje a OpenAI...');
    setIsLoading(true);

    try {
      // Obtener identificador (simplificado para cliente)
      const clientIp = `user-${Date.now()}`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje: content,
          historial: chatHistoria, // Enviar todo el historial para mantener contexto
          captchaToken: 'test-token-local', // Token dummy para pruebas
          clientIp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar el mensaje');
      }

      // Leer el stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        console.log('🤖 [IA] Recibiendo respuesta en streaming...');
        
        // Agregar mensaje vacío para IA que se irá llenando
        const tempMessage: Message = {
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };
        setChatHistoria((prev) => [...prev, tempMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('✅ [IA] Respuesta completa recibida');
            
            // IMPORTANTE: Actualizar conversacion con respuesta del bot
            setLeadFlowState(prev => ({
              ...prev,
              conversacion: [
                ...prev.conversacion,
                `Bot: ${fullResponse}`
              ]
            }));
            console.log('💾 [CHATBOX] Respuesta del bot guardada en conversacion para detección de contexto');
            
            break;
          }

          const chunk = decoder.decode(value);
          fullResponse += chunk;

          // Actualizar el último mensaje con el contenido acumulado
          setChatHistoria((prev) => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = {
              role: "assistant",
              content: fullResponse,
              timestamp: new Date(),
            };
            return newHistory;
          });
        }
      }

      // Reset captcha después de uso exitoso (DESHABILITADO PARA PRUEBAS)
      // if (recaptchaRef.current) {
      //   recaptchaRef.current.reset();
      //   setCaptchaToken("");
      // }

    } catch (error) {
      console.error('[Chatbox] Error:', error instanceof Error ? error.message : 'Unknown');
      setError(error instanceof Error ? error.message : 'Error desconocido');
      // Remover el mensaje del usuario si hubo error
      setChatHistoria((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl h-[85vh] bg-white dark:bg-[#212121] rounded-2xl shadow-2xl overflow-hidden">
      {/* Header - Estilo ChatGPT */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#2f2f2f]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center">
            <BotIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">PmDevOps</span>
        </div>
        {chatHistoria.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {chatHistoria.length} {chatHistoria.length === 1 ? 'mensaje' : 'mensajes'}
          </span>
        )}
      </div>

      {/* Chat Area - Estilo ChatGPT */}
      <div className="flex-1 overflow-y-auto">
        {chatHistoria.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center mb-4 shadow-lg">
              <BotIcon className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              ¿Cómo puedo ayudarte?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8 max-w-md">
              Especialista en desarrollo web, automatización y chatbots con IA
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              <button 
                onClick={() => handleUserMessage("Hola, estoy interesado en desarrollo web. ¿Qué servicios ofrecés y cuáles son tus especialidades?")}
                className="p-4 bg-white dark:bg-[#2f2f2f] hover:bg-gray-50 dark:hover:bg-[#3a3a3a] border border-gray-200 dark:border-[#404040] rounded-xl text-left transition-all duration-200 group"
              >
                <div className="text-gray-700 dark:text-gray-300 font-medium mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Desarrollo Web
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Aplicaciones modernas y escalables
                </div>
              </button>
              <button 
                onClick={() => handleUserMessage("Me gustaría crear un chatbot con inteligencia artificial. ¿Qué opciones tengo y cómo funciona?")}
                className="p-4 bg-white dark:bg-[#2f2f2f] hover:bg-gray-50 dark:hover:bg-[#3a3a3a] border border-gray-200 dark:border-[#404040] rounded-xl text-left transition-all duration-200 group"
              >
                <div className="text-gray-700 dark:text-gray-300 font-medium mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Chatbots con IA
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Asistentes inteligentes personalizados
                </div>
              </button>
              <button 
                onClick={() => handleUserMessage("Necesito una auditoría técnica de mi sistema. ¿Qué incluye el servicio y cómo lo realizan?")}
                className="p-4 bg-white dark:bg-[#2f2f2f] hover:bg-gray-50 dark:hover:bg-[#3a3a3a] border border-gray-200 dark:border-[#404040] rounded-xl text-left transition-all duration-200 group"
              >
                <div className="text-gray-700 dark:text-gray-300 font-medium mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Auditoría Técnica
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Análisis profundo de tu código
                </div>
              </button>
              <button 
                onClick={() => handleUserMessage("¿Cuáles son tus tarifas y cómo funcionan los presupuestos?")}
                className="p-4 bg-white dark:bg-[#2f2f2f] hover:bg-gray-50 dark:hover:bg-[#3a3a3a] border border-gray-200 dark:border-[#404040] rounded-xl text-left transition-all duration-200 group"
              >
                <div className="text-gray-700 dark:text-gray-300 font-medium mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Presupuesto
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Información sobre precios y planes
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {chatHistoria.map((mensaje, index) => (
              <Mensaje
                key={index}
                mensaje={mensaje.content}
                esIA={mensaje.role !== "user"}
              />
            ))}
            {isLoading && <Mensaje mensaje="" esIA={true} isLoading={true} />}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg text-red-600 dark:text-red-300 text-sm flex items-start gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Input Area - Estilo ChatGPT */}
      <div className="p-4 border-t border-gray-200 dark:border-[#2f2f2f] bg-white dark:bg-[#212121]">
        <ChatForm setChatGPT={handleUserMessage} isDisabled={isLoading} />
      </div>
    </div>
  );
}
