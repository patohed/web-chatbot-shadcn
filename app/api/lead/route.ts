import { NextRequest, NextResponse } from 'next/server';
import { CloseSaleFactory } from '@/lib/factories/lead-factory';
import { LeadRequest } from '@/types/lead';

export async function POST(request: NextRequest) {
  console.log('📨 [API /lead] Recibiendo POST request...');
  
  try {
    const body: LeadRequest = await request.json();
    
    console.log('📋 [API /lead] Payload recibido:', {
      nombre: body.nombre,
      email: body.email,
      telefono: body.telefono || '(no proporcionado)',
      proyectoLength: body.proyecto?.length || 0,
      tieneResumen: !!body.resumenConversacion,
    });

    // Validación básica
    if (!body.nombre || !body.email || !body.proyecto) {
      return NextResponse.json(
        { error: 'Nombre, email y proyecto son requeridos' },
        { status: 400 }
      );
    }

    // Ejecutar caso de uso
    const closeSaleUseCase = CloseSaleFactory.create();
    const result = await closeSaleUseCase.execute(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      leadId: result.leadId,
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
