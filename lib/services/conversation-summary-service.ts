/**
 * 📝 CONVERSATION SUMMARY SERVICE
 * Clean Architecture - Uncle Bob
 * 
 * Responsabilidad: Capturar y resumir conversaciones usando IA
 * - Captura toda la conversación hasta el momento del cierre
 * - Usa OpenAI para generar resumen inteligente
 * - Extrae puntos clave: necesidades, presupuesto, timeline
 * - Formato profesional para email
 */

import OpenAI from 'openai';
import { Message } from '@/types/domain';

export interface ConversationSummary {
  fullConversation: string[]; // Conversación completa para guardar
  aiSummary: string;          // Resumen generado por IA
  keyPoints: string[];        // Puntos clave extraídos
  detectedNeeds: string[];    // Necesidades detectadas
  generatedAt: Date;
}

export class ConversationSummaryService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Captura la conversación completa hasta el momento
   */
  captureFullConversation(messages: Message[]): string[] {
    return messages.map(msg => {
      const role = msg.role === 'user' ? 'Cliente' : 'Asistente';
      return `${role}: ${msg.content}`;
    });
  }

  /**
   * Genera resumen inteligente usando IA
   * Early return si hay error
   */
  async generateAISummary(
    conversation: string[],
    maxTokens: number = 500
  ): Promise<{ success: boolean; summary?: string; error?: string }> {
    
    // Early return si no hay conversación
    if (!conversation || conversation.length === 0) {
      return {
        success: false,
        error: 'No hay conversación para resumir'
      };
    }

    console.log('📝 [SUMMARY] Generando resumen con IA...');
    console.log('📝 [SUMMARY] Mensajes a resumir:', conversation.length);

    try {
      const conversationText = conversation.join('\n');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Sos un asistente experto en analizar conversaciones de ventas. Tu trabajo es generar un resumen profesional y conciso de la conversación entre un cliente potencial y un desarrollador de software.

FORMATO DEL RESUMEN:
1. CONTEXTO: En 1-2 líneas, qué está buscando el cliente
2. NECESIDADES DETECTADAS: Lista de necesidades específicas mencionadas
3. PUNTOS CLAVE: Información importante (presupuesto, timeline, tecnologías, etc.)
4. PRÓXIMOS PASOS: Qué se acordó o qué falta definir

Sé CONCISO pero COMPLETO. Máximo 200 palabras. Formato profesional para un email.`
          },
          {
            role: 'user',
            content: `Resume esta conversación:\n\n${conversationText}`
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.3, // Baja temperatura para resúmenes precisos
      });

      const summary = response.choices[0]?.message?.content;

      // Early return si no hay resumen
      if (!summary) {
        return {
          success: false,
          error: 'No se pudo generar el resumen'
        };
      }

      console.log('✅ [SUMMARY] Resumen generado exitosamente');
      console.log('📝 [SUMMARY] Longitud:', summary.length, 'caracteres');

      return {
        success: true,
        summary: summary.trim()
      };

    } catch (error) {
      console.error('❌ [SUMMARY] Error al generar resumen:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Extrae puntos clave de la conversación (sin IA, análisis simple)
   */
  extractKeyPoints(conversation: string[]): string[] {
    const keyPoints: string[] = [];
    const keywords = [
      'presupuesto', 'precio', 'costo', 'cuanto',
      'plazo', 'tiempo', 'urgente', 'fecha',
      'tecnología', 'framework', 'lenguaje',
      'e-commerce', 'app', 'web', 'móvil', 'bot'
    ];

    conversation.forEach(msg => {
      const msgLower = msg.toLowerCase();
      keywords.forEach(keyword => {
        if (msgLower.includes(keyword) && !keyPoints.includes(msg)) {
          // Extraer la línea completa si contiene keyword
          keyPoints.push(msg);
        }
      });
    });

    return keyPoints.slice(0, 5); // Máximo 5 puntos clave
  }

  /**
   * Detecta necesidades mencionadas
   */
  detectNeeds(conversation: string[]): string[] {
    const needs: string[] = [];
    const needKeywords = [
      { keyword: 'e-commerce', need: 'Tienda online / E-commerce' },
      { keyword: 'tienda online', need: 'Tienda online / E-commerce' },
      { keyword: 'página web', need: 'Desarrollo de sitio web' },
      { keyword: 'app móvil', need: 'Aplicación móvil' },
      { keyword: 'aplicación', need: 'Desarrollo de aplicación' },
      { keyword: 'chatbot', need: 'Bot conversacional con IA' },
      { keyword: 'bot', need: 'Automatización con bots' },
      { keyword: 'whatsapp', need: 'Bot para WhatsApp' },
      { keyword: 'instagram', need: 'Bot para Instagram' },
      { keyword: 'automatiza', need: 'Automatización de procesos' },
      { keyword: 'integra', need: 'Integración de sistemas' },
      { keyword: 'api', need: 'Desarrollo de API' },
      { keyword: 'dashboard', need: 'Panel de administración' },
    ];

    const conversationText = conversation.join(' ').toLowerCase();

    needKeywords.forEach(({ keyword, need }) => {
      if (conversationText.includes(keyword) && !needs.includes(need)) {
        needs.push(need);
      }
    });

    return needs;
  }

  /**
   * Genera resumen completo con toda la información
   * Este es el método principal que se llama desde el orchestrator
   */
  async generateFullSummary(
    messages: Message[]
  ): Promise<{ success: boolean; summary?: ConversationSummary; error?: string }> {
    
    console.log('📝 [SUMMARY] Iniciando generación de resumen completo...');

    // Capturar conversación completa
    const fullConversation = this.captureFullConversation(messages);

    // Early return si no hay conversación
    if (fullConversation.length === 0) {
      return {
        success: false,
        error: 'No hay mensajes para resumir'
      };
    }

    // Generar resumen con IA
    const aiResult = await this.generateAISummary(fullConversation);

    // Early return si falla el resumen
    if (!aiResult.success || !aiResult.summary) {
      // Fallback: Usar resumen simple sin IA
      console.log('⚠️ [SUMMARY] Fallback: usando resumen simple');
      const simpleSummary = this.generateSimpleSummary(fullConversation);
      
      return {
        success: true,
        summary: {
          fullConversation,
          aiSummary: simpleSummary,
          keyPoints: this.extractKeyPoints(fullConversation),
          detectedNeeds: this.detectNeeds(fullConversation),
          generatedAt: new Date(),
        }
      };
    }

    // Crear resumen completo
    const summary: ConversationSummary = {
      fullConversation,
      aiSummary: aiResult.summary,
      keyPoints: this.extractKeyPoints(fullConversation),
      detectedNeeds: this.detectNeeds(fullConversation),
      generatedAt: new Date(),
    };

    console.log('✅ [SUMMARY] Resumen completo generado:');
    console.log('   - Mensajes capturados:', fullConversation.length);
    console.log('   - Resumen IA:', summary.aiSummary.length, 'chars');
    console.log('   - Puntos clave:', summary.keyPoints.length);
    console.log('   - Necesidades:', summary.detectedNeeds.length);

    return {
      success: true,
      summary
    };
  }

  /**
   * Genera resumen simple sin IA (fallback)
   */
  private generateSimpleSummary(conversation: string[]): string {
    const needs = this.detectNeeds(conversation);
    const needsText = needs.length > 0 
      ? `Necesidades detectadas: ${needs.join(', ')}`
      : 'Consulta general sobre servicios de desarrollo';

    return `
📋 RESUMEN DE LA CONVERSACIÓN

${needsText}

Total de mensajes intercambiados: ${conversation.length}

Conversación completa disponible en el detalle del lead.
    `.trim();
  }

  /**
   * Formatea el resumen para el email
   */
  formatForEmail(summary: ConversationSummary): string {
    let formatted = `
📋 RESUMEN DE LA CONVERSACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${summary.aiSummary}
`;

    if (summary.detectedNeeds.length > 0) {
      formatted += `

🎯 NECESIDADES DETECTADAS:
${summary.detectedNeeds.map(need => `  • ${need}`).join('\n')}
`;
    }

    if (summary.keyPoints.length > 0) {
      formatted += `

🔑 PUNTOS CLAVE MENCIONADOS:
${summary.keyPoints.slice(0, 3).map(point => `  • ${point}`).join('\n')}
`;
    }

    formatted += `

📅 Resumen generado: ${summary.generatedAt.toLocaleString('es-AR')}
💬 Total de mensajes: ${summary.fullConversation.length}
`;

    return formatted;
  }
}
