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

      // CASO 1: Flujo activo de captura de leads
      if (leadFlowState.step !== 'idle' && leadFlowState.step !== 'completed') {
        console.log('✅ [CHATBOX] FLUJO DE CIERRE ACTIVO - Procesando con orchestrator (NO IA)');
        await handleActiveCloseSaleFlow(content, updatedConversacion);
        return;
      } else {
        console.log('🔵 [CHATBOX] Flujo en estado:', leadFlowState.step);
      }

      // CASO 2: Detectar disparador de intención de cierre
      if (leadFlowState.step === 'idle') {
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

    // Procesar respuesta usando orchestrator
    const result = await closeSaleOrchestrator.current.processGoalResponse(
      content,
      { ...leadFlowState, conversacion }
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
    <div className="flex flex-col w-full max-w-4xl h-[600px] bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-3xl shadow-2xl shadow-purple-500/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 bg-zinc-900/30">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
          <div>
            <h3 className="font-semibold text-white">Asistente PmDevOps</h3>
            <p className="text-xs text-gray-400">Responde en segundos</p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {chatHistoria.length > 0 && `${chatHistoria.length} mensajes`}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {chatHistoria.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
              <BotIcon className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">¡Hola! Soy tu asistente virtual</h3>
            <p className="text-gray-400 text-sm mb-4 max-w-md">
              Puedo ayudarte con consultas sobre desarrollo web, automatización, chatbots con IA y más. ¿En qué proyecto estás trabajando?
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button 
                onClick={() => handleUserMessage("Hola, estoy interesado en desarrollo web. ¿Qué servicios ofrecés y cuáles son tus especialidades?")}
                className="px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800/50 rounded-full text-sm text-gray-300 transition-all duration-200 hover:border-purple-500/30 hover:scale-105"
              >
                💻 Desarrollo web
              </button>
              <button 
                onClick={() => handleUserMessage("Me gustaría crear un chatbot con inteligencia artificial. ¿Qué opciones tengo y cómo funciona?")}
                className="px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800/50 rounded-full text-sm text-gray-300 transition-all duration-200 hover:border-purple-500/30 hover:scale-105"
              >
                🤖 Chatbots con IA
              </button>
              <button 
                onClick={() => handleUserMessage("Necesito una auditoría técnica de mi sistema. ¿Qué incluye el servicio y cómo lo realizan?")}
                className="px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800/50 rounded-full text-sm text-gray-300 transition-all duration-200 hover:border-purple-500/30 hover:scale-105"
              >
                🔍 Auditoría técnica
              </button>
            </div>
          </div>
        ) : (
          <>
            {chatHistoria.map((mensaje, index) => (
              <Mensaje
                key={index}
                mensaje={mensaje.content}
                esIA={mensaje.role !== "user"}
              />
            ))}
            {isLoading && <Mensaje mensaje="" esIA={true} isLoading={true} />}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-2 animate-in fade-in duration-300">
          <span className="text-red-400">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Captcha - DESHABILITADO PARA PRUEBAS */}
      {/* 
      {showCaptcha && (
        <div className="flex justify-center mb-3 px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
              onChange={handleCaptchaChange}
              theme="dark"
            />
          </div>
        </div>
      )}
      */}

      {/* Input Area */}
      <div className="px-4 pb-4 pt-2 border-t border-zinc-800/50 bg-zinc-900/30">
        <ChatForm setChatGPT={handleUserMessage} isDisabled={isLoading} />
      </div>
    </div>
  );
}
