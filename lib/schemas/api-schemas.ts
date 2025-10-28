/**
 * 🛡️ API Request/Response Schemas
 * Validación con Zod para prevenir inyección y datos malformados
 * 
 * Clean Architecture - Interface Adapters Layer
 */

import { z } from 'zod';

// ====================================
// VALIDADORES REUTILIZABLES
// ====================================

const emailSchema = z.string()
  .email('Email inválido')
  .min(5, 'Email muy corto')
  .max(100, 'Email muy largo')
  .toLowerCase()
  .trim();

const nombreSchema = z.string()
  .min(2, 'Nombre muy corto')
  .max(100, 'Nombre muy largo')
  .trim()
  .refine(
    (val) => !/[<>]/.test(val), 
    'Nombre contiene caracteres inválidos'
  );

const telefonoSchema = z.string()
  .max(30, 'Teléfono muy largo')
  .trim()
  .optional()
  .or(z.literal(''));

const proyectoSchema = z.string()
  .min(10, 'Descripción del proyecto muy corta (mínimo 10 caracteres)')
  .max(2000, 'Descripción del proyecto muy larga (máximo 2000 caracteres)')
  .trim()
  .refine(
    (val) => !/[<>]/.test(val), 
    'Descripción contiene caracteres inválidos'
  );

const mensajeSchema = z.string()
  .min(1, 'Mensaje vacío')
  .max(2000, 'Mensaje muy largo (máximo 2000 caracteres)')
  .trim()
  .refine(
    (val) => !/[<>]/.test(val), 
    'Mensaje contiene caracteres inválidos'
  );

// ====================================
// SCHEMA: POST /api/lead
// ====================================

export const leadRequestSchema = z.object({
  nombre: nombreSchema,
  email: emailSchema,
  telefono: telefonoSchema,
  proyecto: proyectoSchema,
  conversacion: z.array(z.string()).optional(),
  resumenConversacion: z.string()
    .max(5000, 'Resumen muy largo')
    .optional(),
});

export type LeadRequestValidated = z.infer<typeof leadRequestSchema>;

// ====================================
// SCHEMA: POST /api/chat
// ====================================

export const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(5000),
  timestamp: z.date().or(z.string().transform((val) => new Date(val))),
});

export const chatRequestSchema = z.object({
  mensaje: mensajeSchema,
  historial: z.array(messageSchema).max(50, 'Historial muy largo (máximo 50 mensajes)'),
  captchaToken: z.string().min(1, 'Token de CAPTCHA requerido'),
  clientIp: z.string().optional(),
});

export type ChatRequestValidated = z.infer<typeof chatRequestSchema>;

// ====================================
// SANITIZACIÓN ADICIONAL
// ====================================

/**
 * Sanitiza strings para prevenir XSS y prompt injection
 * Elimina caracteres peligrosos pero mantiene legibilidad
 */
export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    // Remover caracteres HTML peligrosos
    .replace(/[<>]/g, '')
    // Remover intentos de prompt injection comunes
    .replace(/(\bignore\b|\bsystem\b:\s*)/gi, '')
    // Limitar saltos de línea consecutivos
    .replace(/\n{3,}/g, '\n\n')
    // Remover caracteres de control excepto \n y \t
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Valida y sanitiza email
 */
export function sanitizeEmail(email: string): string {
  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@._+-]/g, ''); // Solo caracteres válidos en email
}

/**
 * Helper para validar schema y devolver error legible
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: firstError.message || 'Datos inválidos',
    };
  }
  
  return {
    success: true,
    data: result.data,
  };
}
