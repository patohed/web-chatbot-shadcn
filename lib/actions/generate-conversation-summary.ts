"use server";

import { ConversationSummaryService } from "../services/conversation-summary-service";
import type { Message } from "@/types/domain";

/**
 * Server Action para generar resumen de conversación con IA
 * Mantiene la API key segura en el servidor
 */
export async function generateConversationSummary(
  messages: Message[]
): Promise<string | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error("❌ [SERVER ACTION] OPENAI_API_KEY no está configurada");
      return null;
    }

    console.log("📝 [SERVER ACTION] Generando resumen de conversación...");
    console.log(`📊 [SERVER ACTION] Total de mensajes: ${messages.length}`);

    const summaryService = new ConversationSummaryService(apiKey);
    const result = await summaryService.generateFullSummary(messages);

    if (!result.success || !result.summary) {
      console.error("❌ [SERVER ACTION] No se pudo generar resumen");
      return null;
    }

    console.log("✅ [SERVER ACTION] Resumen generado exitosamente");
    console.log("📋 [SERVER ACTION] Resumen IA:", result.summary.aiSummary.substring(0, 100) + "...");

    // Formatear para email
    const formattedSummary = summaryService.formatForEmail(result.summary);
    return formattedSummary;
  } catch (error) {
    console.error("❌ [SERVER ACTION] Error generando resumen:", error);
    return null;
  }
}
