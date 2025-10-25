// Infrastructure Layer - Servicio de IA
import OpenAI from 'openai';
import { Message } from '@/types/domain';
import { config } from '../config';

export class AIService {
  private client: OpenAI;
  private systemPrompt: string;

  constructor(apiKey: string, systemPrompt: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.client = new OpenAI({ apiKey });
    this.systemPrompt = systemPrompt;
  }

  async generateStream(messages: Message[]): Promise<ReadableStream<Uint8Array>> {
    // Convertir mensajes del dominio al formato de OpenAI
    const openAIMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    const stream = await this.client.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: this.systemPrompt,
        },
        ...openAIMessages,
      ],
      stream: true,
      temperature: config.openai.temperature,
      max_tokens: config.openai.maxTokens,
    });

    return new ReadableStream({
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
  }

  // Método para validar la configuración
  static validateApiKey(apiKey: string): boolean {
    return Boolean(apiKey && apiKey.startsWith('sk-'));
  }
}
