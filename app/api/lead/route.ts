import { NextRequest, NextResponse } from 'next/server';
import { CloseSaleFactory } from '@/lib/factories/lead-factory';
import { leadRequestSchema, validateSchema, sanitizeUserInput, sanitizeEmail } from '@/lib/schemas/api-schemas';

export async function POST(request: NextRequest) {
  console.log('📨 [API /lead] Recibiendo POST request...');
  
  try {
    const body = await request.json();
    
    // 🛡️ VALIDACIÓN CON ZOD
    const validation = validateSchema(leadRequestSchema, body);
    
    if (!validation.success) {
      console.warn('⚠️ [API /lead] Validación fallida:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const validatedData = validation.data;
    
    // 🧹 SANITIZACIÓN ADICIONAL
    const sanitizedLead = {
      nombre: sanitizeUserInput(validatedData.nombre),
      email: sanitizeEmail(validatedData.email),
      telefono: validatedData.telefono ? sanitizeUserInput(validatedData.telefono) : undefined,
      proyecto: sanitizeUserInput(validatedData.proyecto),
      conversacion: validatedData.conversacion?.map(msg => sanitizeUserInput(msg)),
      resumenConversacion: validatedData.resumenConversacion ? sanitizeUserInput(validatedData.resumenConversacion) : undefined,
    };
    
    console.log('📋 [API /lead] Payload validado y sanitizado:', {
      nombre: sanitizedLead.nombre,
      email: sanitizedLead.email,
      telefono: sanitizedLead.telefono || '(no proporcionado)',
      proyectoLength: sanitizedLead.proyecto?.length || 0,
      tieneResumen: !!sanitizedLead.resumenConversacion,
    });

    // Ejecutar caso de uso con datos sanitizados
    const closeSaleUseCase = CloseSaleFactory.create();
    const result = await closeSaleUseCase.execute(sanitizedLead);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    console.log('📊 [API /lead] Resultado del caso de uso:', {
      success: result.success,
      leadId: result.leadId,
      emailSent: result.emailSent,
      hasError: !!result.error,
    });
    
    if (result.error) {
      console.error('⚠️ [API /lead] WARNING:', result.error);
    }
    
    return NextResponse.json({
      success: true,
      leadId: result.leadId,
      emailSent: result.emailSent,
      message: '¡Perfecto! Recibí toda tu información. Me voy a contactar con vos a la brevedad para discutir tu proyecto en detalle. ¡Gracias por tu interés! 🚀',
    });
  } catch (error) {
    console.error('[API /lead] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
