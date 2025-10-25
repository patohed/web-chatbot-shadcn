"use client"

import { useState, useRef, useEffect } from "react";
import Mensaje from "./mensaje";
import ChatForm from "./chat-form";
import { BotIcon } from "lucide-react";
import { Message } from "@/types/domain";
import { LeadFlowState } from "@/types/lead-flow";
import { LeadFlowService } from "@/lib/services/lead-flow-service";

export default function Chatbox() {
  const [chatHistoria, setChatHistoria] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [leadFlowState, setLeadFlowState] = useState<LeadFlowState>({
    step: 'idle',
    data: {},
    conversacion: [],
  });
  const leadFlowService = useRef(new LeadFlowService());
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistoria, isLoading]);

  // ===================================================================
  // ASYNC HANDLERS - Mejores prácticas con async/await y early returns
  // ===================================================================

  /**
   * Handler principal de mensajes del usuario
   * Coordina entre flujo de leads (hardcode) y respuestas de IA
   */
  const handleUserMessage = async (content: string): Promise<void> => {
    try {
      const userMessage: Message = {
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setError("");
      setChatHistoria(prev => [...prev, userMessage]);

      const updatedConversacion = [
        ...leadFlowState.conversacion, 
        `Cliente: ${content}`
      ];
      
      setLeadFlowState(prev => ({
        ...prev,
        conversacion: updatedConversacion,
      }));
      
      console.log('🔍 [DEBUG] Estado del flujo:', leadFlowState.step);
      console.log('🔍 [DEBUG] Mensaje del usuario:', content);
      
      // Verificar si estamos en un flujo activo de captura de leads
      if (leadFlowState.step !== 'idle' && leadFlowState.step !== 'completed') {
        await handleLeadFlowResponse(content, updatedConversacion);
        return;
      }

      // Detectar intención de compra
      if (leadFlowState.step === 'idle') {
        const intentDetected = await handleIntentDetection(content, updatedConversacion);
        if (intentDetected) return;
      }

      // Flujo normal con IA
      await handleAIResponse(content);
    } catch (error) {
      console.error('[Chatbox] Error en handleUserMessage:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  /**
   * Maneja respuestas dentro del flujo de captura de leads
   * Lógica 100% hardcoded con validaciones
   */
  const handleLeadFlowResponse = async (
    content: string, 
    conversacion: string[]
  ): Promise<void> => {
    console.log('✅ [HARDCODE] Flujo activo - Procesando con lógica hardcoded');
    
    const { newState, botResponse, shouldSendLead, validationError } = 
      leadFlowService.current.processUserResponse(content, {
        ...leadFlowState,
        conversacion,
      });

    setLeadFlowState(newState);

    // Early return si hay error de validación
    if (validationError) {
      console.log('⚠️ [HARDCODE] Error de validación:', validationError);
      const errorMsg: Message = {
        role: 'assistant',
        content: validationError,
        timestamp: new Date(),
      };
      setChatHistoria(prev => [...prev, errorMsg]);
      return;
    }

    // Mostrar respuesta del flujo si existe
    if (botResponse) {
      console.log('💬 [HARDCODE] Respuesta del flujo:', botResponse);
      const flowMsg: Message = {
        role: 'assistant',
        content: botResponse,
        timestamp: new Date(),
      };
      setChatHistoria(prev => [...prev, flowMsg]);
    }

    // Enviar lead si está completo
    if (shouldSendLead) {
      console.log('📧 [HARDCODE] Enviando lead al API...');
      try {
        await sendLeadToAPI(newState);
      } catch (error) {
        console.error('[HARDCODE] Error al enviar lead:', error);
        setError('Hubo un problema al guardar tu información, pero me pondré en contacto.');
      }
    }
  };

  /**
   * Detecta intención de compra e inicia flujo de captura
   * Retorna true si se activó el flujo
   */
  const handleIntentDetection = async (
    content: string,
    conversacion: string[]
  ): Promise<boolean> => {
    const hasIntent = leadFlowService.current.detectPurchaseIntent(
      content, 
      conversacion
    );
    
    console.log('🔍 [DEBUG] ¿Detecta intención de compra?:', hasIntent);
    
    if (!hasIntent) return false;

    console.log('🎯 [HARDCODE] Intención detectada - Iniciando flujo de captura');
    
    const nextQuestion = leadFlowService.current.getNextQuestion('idle', leadFlowState);
    
    if (!nextQuestion) return false;

    const newFlowState: LeadFlowState = {
      step: nextQuestion.step,
      data: {
        proyecto: leadFlowService.current.extractProjectDescription(conversacion),
      },
      conversacion,
      startedAt: new Date(),
    };
    
    setLeadFlowState(newFlowState);
    
    console.log('💬 [HARDCODE] Pregunta inicial:', nextQuestion.question);
    
    const flowMsg: Message = {
      role: 'assistant',
      content: nextQuestion.question,
      timestamp: new Date(),
    };
    setChatHistoria(prev => [...prev, flowMsg]);
    
    return true;
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

  /**
   * Envía lead capturado al API
   * Manejo robusto de errores con validaciones
   */
  const sendLeadToAPI = async (flowState: LeadFlowState): Promise<void> => {
    const { nombre, email, telefono, proyecto } = flowState.data;
    
    // Validación: Datos obligatorios
    if (!nombre || !email || !proyecto) {
      const error = 'Datos incompletos para enviar lead';
      console.error('[Chatbox]', error, { nombre, email, proyecto });
      throw new Error(error);
    }

    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre,
        email,
        telefono,
        proyecto,
        conversacion: flowState.conversacion,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Error desconocido del servidor'
      }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('[Chatbox] Lead enviado exitosamente:', result.leadId);
    
    return result;
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
