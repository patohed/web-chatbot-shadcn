import { NextRequest, NextResponse } from 'next/server';
import { ChatUseCaseFactory } from '@/lib/factories/chat-factory';
import { chatRequestSchema, validateSchema, sanitizeUserInput } from '@/lib/schemas/api-schemas';
import { Message } from '@/types/domain';

// Función helper para obtener identificador del cliente
function getClientIdentifier(request: NextRequest): string {
  // En producción, usar IP real
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback: generar ID de sesión temporal
  return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 🛡️ VALIDACIÓN CON ZOD
    const validation = validateSchema(chatRequestSchema, body);
    
    if (!validation.success) {
      console.warn('⚠️ [API /chat] Validación fallida:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const validatedData = validation.data;
    
    // 🧹 SANITIZACIÓN DEL MENSAJE
    const sanitizedMessage = sanitizeUserInput(validatedData.mensaje);
    
    // 🧹 SANITIZAR HISTORIAL
    const sanitizedHistorial = validatedData.historial.map(msg => ({
      ...msg,
      content: sanitizeUserInput(msg.content),
    }));

    // Construir historial completo (mensajes previos + nuevo mensaje)
    const mensajesCompletos: Message[] = [
      ...sanitizedHistorial,
      {
        role: 'user',
        content: sanitizedMessage,
        timestamp: new Date(),
      }
    ];

    // Obtener identificador del cliente
    const identifier = validatedData.clientIp || getClientIdentifier(request);

    // Ejecutar caso de uso con historial completo
    const chatUseCase = ChatUseCaseFactory.create();
    const result = await chatUseCase.execute(mensajesCompletos, validatedData.captchaToken, identifier);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error desconocido' },
        { status: 400 }
      );
    }

    // Retornar stream
    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    });
  } catch (error) {
    console.error('[API /chat] Error:', error instanceof Error ? error.message : 'Unknown');
    
    // No exponer detalles internos
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

