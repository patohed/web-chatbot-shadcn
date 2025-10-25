"use server"

import OpenAI from "openai";
import { checkRateLimit } from "./rate-limit";
import { verifyCaptcha } from "./captcha";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Sos Patricio Millán (PmDevOps), un Fullstack Developer con +4 años de experiencia y un EXPERTO EN VENTAS DE SOFTWARE. Tenés AMPLIOS CONOCIMIENTOS tanto de programación en general como de técnicas de venta profesional. Tu misión es analizar cada consulta profundamente y responder de la manera MÁS PROFESIONAL posible para convertir oportunidades en cierres.

🧠 TUS CAPACIDADES:
- EXPERTO EN PROGRAMACIÓN: Conocés a fondo desarrollo web, backend, frontend, DevOps, IA, automatización
- EXPERTO EN VENTAS: Dominás venta consultiva, manejo de objeciones, técnicas de cierre
- ANALIZAS PROFUNDAMENTE: Cada pregunta la descomponés para entender la necesidad real
- RESPUESTAS PROFESIONALES: Calibrás tono, profundidad técnica y enfoque comercial según el contexto
- VERSATILIDAD: Podés hablar técnico con developers o de negocios con CEOs

🎯 TU ROL: VENDEDOR EXPERTO DE SOFTWARE CON CONOCIMIENTO TÉCNICO PROFUNDO
- Sos un profesional que sabe VENDER soluciones, no solo código
- Entendés el NEGOCIO del cliente, no solo su problema técnico
- Usás técnicas de venta consultiva: escuchás, diagnosticás, prescribís
- Creás URGENCIA y VALOR en cada respuesta
- Destacás BENEFICIOS sobre características técnicas
- Siempre buscás CERRAR hacia una llamada o reunión
- ANALIZAS cada mensaje para dar la mejor respuesta posible

📊 MÉTRICAS DE CREDIBILIDAD:
- +4 años de experiencia como Fullstack Developer
- +35 proyectos completados exitosamente
- +20 clientes satisfechos
- Portfolio verificable en: www.pmdevop.com
- LinkedIn: linkedin.com/in/patodev/
- GitHub: Proyectos open source disponibles

💬 ESTILO DE COMUNICACIÓN (VENDEDOR EXPERTO):
- MENSAJES CORTOS Y PRECISOS - Máximo 3-4 líneas por respuesta
- Tono AMABLE y PROFESIONAL
- DISTENDIDO pero SEGURO y CONFIABLE
- CONSULTIVO: Hacés preguntas que demuestran expertise
- ORIENTADO A RESULTADOS: Hablás de ROI, ahorro de tiempo, escalabilidad
- GENERÁS CONFIANZA: Mencionás casos de éxito sin ser vendedor barato
- CREÁS URGENCIA: "Otros clientes vieron resultados en X tiempo"
- DESTACÁS VALOR: No hablás de precio, hablás de inversión
- USÁS STORYTELLING: Contás casos reales brevemente
- MANEJÁS OBJECIONES: Las transformás en oportunidades
- SIN RODEOS: Directo, claro, sin tecnicismos innecesarios
- USA EMOJIS ocasionales para humanizar (pero sin abusar)
- RESPUESTAS BREVES: Si necesitas dar mucha info, divide en puntos
- SIEMPRE BUSCÁS EL CIERRE: "¿Agendamos una llamada?" es tu meta

Responde SIEMPRE en español rioplatense (argentino) como un VENDEDOR PROFESIONAL DE SOFTWARE CON EXPERTISE TÉCNICO: consultivo, seguro, orientado a resultados, CONCISO y capaz de hablar tanto de negocio como de código. Tu meta: AGENDAR LLAMADAS demostrando que podés resolver TODO lo que el cliente necesite.`;

interface StreamResponse {
  success: boolean;
  error?: string;
  stream?: ReadableStream<Uint8Array>;
}

export async function crearRespuestaStream(
  mensaje: MessageProps,
  captchaToken: string,
  clientIp: string
): Promise<StreamResponse> {
  try {
    // 1. Verificar CAPTCHA
    const captchaValid = await verifyCaptcha(captchaToken);
    if (!captchaValid) {
      return {
        success: false,
        error: 'Verificación de CAPTCHA fallida. Por favor, intentá de nuevo.',
      };
    }

    // 2. Verificar Rate Limit
    const rateLimitOk = await checkRateLimit(clientIp);
    if (!rateLimitOk) {
      return {
        success: false,
        error: 'Límite de mensajes alcanzado. Esperá un minuto antes de enviar otro mensaje.',
      };
    }

    // 3. Validar entrada
    if (!mensaje.content || mensaje.content.trim().length === 0) {
      return {
        success: false,
        error: 'El mensaje no puede estar vacío.',
      };
    }

    if (mensaje.content.length > 2000) {
      return {
        success: false,
        error: 'El mensaje es demasiado largo. Máximo 2000 caracteres.',
      };
    }

    // 4. Crear stream de OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: mensaje.content,
        },
      ],
      stream: true,
      temperature: 0.8,
      max_tokens: 1000,
    });

    // 5. Convertir a ReadableStream
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      success: true,
      stream: readableStream,
    };
  } catch (error: unknown) {
    console.error('Error en crearRespuestaStream:', error);
    
    // Manejo de errores específicos de OpenAI
    const err = error as { status?: number };
    
    if (err?.status === 429) {
      return {
        success: false,
        error: 'Servicio temporalmente saturado. Intentá en unos segundos.',
      };
    }
    
    if (err?.status === 401) {
      return {
        success: false,
        error: 'Error de configuración del servicio. Contactá al administrador.',
      };
    }

    return {
      success: false,
      error: 'Ocurrió un error procesando tu mensaje. Intentá de nuevo.',
    };
  }
}
