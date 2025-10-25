"use client"

import { useState, useRef, useEffect } from "react";
import Mensaje from "./mensaje";
import ChatForm from "./chat-form";
import LeadForm from "./lead-form";
// import ReCAPTCHA from "react-google-recaptcha"; // DESHABILITADO PARA PRUEBAS
import { BotIcon } from "lucide-react";
import { Message } from "@/types/domain";

export default function Chatbox() {
  const [chatHistoria, setChatHistoria] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showLeadForm, setShowLeadForm] = useState<boolean>(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState<boolean>(false);
  // const [captchaToken, setCaptchaToken] = useState<string>(""); // DESHABILITADO PARA PRUEBAS
  // const [showCaptcha, setShowCaptcha] = useState<boolean>(false); // DESHABILITADO PARA PRUEBAS
  // const recaptchaRef = useRef<ReCAPTCHA>(null); // DESHABILITADO PARA PRUEBAS
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistoria, isLoading]);

  // Detectar si el bot está solicitando datos (activar formulario)
  useEffect(() => {
    if (chatHistoria.length === 0) return;
    
    const ultimoMensajeBot = [...chatHistoria]
      .reverse()
      .find(msg => msg.role === 'assistant');
    
    if (!ultimoMensajeBot) return;
    
    // Palabras clave que indican que el bot quiere cerrar la venta
    const palabrasClaveCierre = [
      'necesito algunos datos',
      'completá tus datos',
      'para avanzar',
      'preparar una propuesta',
      'nombre completo',
      'tu email',
      'tu correo',
      'tu teléfono',
      'contáctarte',
    ];
    
    const contenidoLower = ultimoMensajeBot.content.toLowerCase();
    const deberíaMostrarForm = palabrasClaveCierre.some(palabra => 
      contenidoLower.includes(palabra)
    );
    
    if (deberíaMostrarForm && !showLeadForm) {
      // Pequeño delay para que se lea el mensaje primero
      setTimeout(() => setShowLeadForm(true), 1000);
    }
  }, [chatHistoria, showLeadForm]);

  const handleUserMessage = async (content: string) => {
    // CAPTCHA DESHABILITADO PARA PRUEBAS
    // // Mostrar captcha después del primer mensaje
    // if (chatHistoria.length === 0) {
    //   setShowCaptcha(true);
    // }

    // // Validar captcha si está visible
    // if (showCaptcha && !captchaToken) {
    //   setError("Por favor, completá el captcha antes de enviar.");
    //   return;
    // }

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setError("");
    setChatHistoria([...chatHistoria, userMessage]);
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
        // Agregar mensaje vacío para IA que se irá llenando
        const tempMessage: Message = {
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };
        setChatHistoria((prev) => [...prev, tempMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

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
  }

  const handleLeadSubmit = async (leadData: {
    nombre: string;
    email: string;
    telefono?: string;
    proyecto: string;
  }) => {
    setIsSubmittingLead(true);
    
    try {
      // Extraer mensajes relevantes de la conversación
      const conversacion = chatHistoria.map(msg => 
        `${msg.role === 'user' ? 'Cliente' : 'Bot'}: ${msg.content}`
      );

      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadData,
          conversacion,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar la información');
      }

      // Cerrar formulario
      setShowLeadForm(false);

      // Agregar mensaje de confirmación del bot
      const confirmacionBot: Message = {
        role: 'assistant',
        content: result.message || '¡Perfecto! Recibí toda tu información. Me voy a contactar con vos a la brevedad. ¡Gracias! 🚀',
        timestamp: new Date(),
      };

      setChatHistoria(prev => [...prev, confirmacionBot]);
    } catch (error) {
      console.error('[Chatbox] Error al enviar lead:', error);
      setError(error instanceof Error ? error.message : 'Error al enviar la información');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleLeadCancel = () => {
    setShowLeadForm(false);
    
    // Agregar mensaje indicando que el usuario canceló
    const mensajeCancelacion: Message = {
      role: 'assistant',
      content: 'Entiendo, no hay problema. Si cambiás de opinión, solo decime y retomamos. ¿Hay algo más en lo que pueda ayudarte?',
      timestamp: new Date(),
    };
    
    setChatHistoria(prev => [...prev, mensajeCancelacion]);
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

      {/* Lead Form Modal */}
      {showLeadForm && (
        <LeadForm
          onSubmit={handleLeadSubmit}
          onCancel={handleLeadCancel}
          isLoading={isSubmittingLead}
        />
      )}
    </div>
  );
}
