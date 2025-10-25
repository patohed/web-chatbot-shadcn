# 🎯 Arquitectura de Goals para Captura de Leads

## Concepto

El sistema de captura de leads funciona con una arquitectura basada en **goals** (objetivos). Cada dato necesario es un "goal" que debe completarse. **Solo cuando TODOS los goals obligatorios están completos, se activa el envío del email.**

## Goals Definidos

### Goals Obligatorios (REQUIRED)
1. ✅ **nombre** - Nombre completo del cliente (mínimo 2 caracteres)
2. ✅ **email** - Email válido para contacto
3. ✅ **proyecto** - Descripción del proyecto (mínimo 10 caracteres)

### Goals Opcionales (OPTIONAL)
4. ⏭️  **telefono** - Teléfono de contacto (puede saltearse)

## Flujo de Captura

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DETECCIÓN DE INTENCIÓN DE CIERRE                         │
│    Usuario dice: "quiero contratar", "dame presupuesto", etc│
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. INICIO DEL FLUJO DE CAPTURA                              │
│    Bot: "¿Cuál es tu nombre completo?"                      │
│    Estado: asking_name                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GOAL: nombre                                             │
│    ✅ Usuario responde: "Juan Pérez"                        │
│    ✅ Validación: mínimo 2 caracteres                       │
│    ✅ Goal completado                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. GOAL: email                                              │
│    Bot: "¿Cuál es tu email?"                                │
│    ✅ Usuario responde: "juan@ejemplo.com"                  │
│    ✅ Validación: formato email válido                      │
│    ✅ Goal completado                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. GOAL: telefono (OPCIONAL)                                │
│    Bot: "¿Tenés un teléfono?"                               │
│    ⏭️  Usuario puede responder "no" o saltar                │
│    ✅ Goal completado (aunque sea skipped)                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. GOAL: proyecto                                           │
│    Bot: "Contame sobre tu proyecto"                         │
│    ✅ Usuario responde: "Necesito un e-commerce..."         │
│    ✅ Validación: mínimo 10 caracteres                      │
│    ✅ Goal completado                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. VERIFICACIÓN DE GOALS COMPLETOS                          │
│    LeadGoalsService.canSendLead() → true                    │
│    ✅ nombre: completo                                       │
│    ✅ email: completo                                        │
│    ✅ proyecto: completo                                     │
│    (telefono es opcional)                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. ACTIVACIÓN DEL ENVÍO                                     │
│    shouldSendLead = true                                     │
│    Estado: completed                                         │
│    Bot: "¡Perfecto! Ya tengo toda la información..."        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. ENVÍO AL API                                             │
│    POST /api/lead                                            │
│    Payload: { nombre, email, telefono, proyecto, conversacion }│
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. USE CASE: Close Sale                                    │
│     ✅ Guardar lead en data/leads.json                       │
│     ✅ Enviar email con Resend                               │
│     ✅ Retornar leadId y confirmación                        │
└─────────────────────────────────────────────────────────────┘
```

## Arquitectura de Código

### 1. LeadGoalsService (`lib/services/lead-goals-service.ts`)
**Responsabilidad**: Gestionar el estado de los goals

```typescript
interface GoalStatus {
  nombre: boolean;
  email: boolean;
  proyecto: boolean;
  telefono: boolean;
}

// Métodos principales:
- evaluateGoals(flowState): Evalúa qué goals están completos
- canSendLead(flowState): true si todos los goals obligatorios están completos
- validateGoal(goalName, value): Valida un goal específico
- debugGoals(flowState): Genera reporte para debugging
```

### 2. LeadFlowService (`lib/services/lead-flow-service.ts`)
**Responsabilidad**: Manejar el flujo conversacional

```typescript
// Usa LeadGoalsService internamente
constructor() {
  this.goalsService = new LeadGoalsService();
}

// Al procesar cada respuesta:
1. Valida el goal actual con goalsService.validateGoal()
2. Guarda el dato si es válido
3. Log: "✅ [GOAL COMPLETADO] nombre/email/proyecto"
4. Verifica con goalsService.canSendLead()
5. Si todos completos → shouldSendLead = true
```

### 3. Chatbox Component (`components/chatbox.tsx`)
**Responsabilidad**: Coordinar UI y flujo

```typescript
const handleLeadFlowResponse = async (content, conversacion) => {
  // Procesa la respuesta con LeadFlowService
  const { newState, botResponse, shouldSendLead, validationError } = 
    leadFlowService.current.processUserResponse(content, flowState);
  
  // Si shouldSendLead = true → Enviar al API
  if (shouldSendLead) {
    console.log('📧 [LEAD] 🎯 Todos los goals completados');
    await sendLeadToAPI(newState);
  }
};
```

### 4. API Route (`app/api/lead/route.ts`)
**Responsabilidad**: Endpoint para recibir leads

```typescript
POST /api/lead
- Valida datos obligatorios
- Ejecuta CloseSaleUseCase
- Retorna leadId y mensaje de éxito
```

### 5. Close Sale Use Case (`lib/use-cases/close-sale-use-case.ts`)
**Responsabilidad**: Lógica de negocio

```typescript
execute(leadRequest) {
  1. Validar datos completos
  2. Guardar lead con LeadService
  3. Enviar email con EmailService
  4. Retornar resultado
}
```

## Logs para Debugging

El sistema genera logs detallados en cada paso:

```
🔍 [DEBUG] Estado del flujo: asking_name
🎯 [GOALS] Procesando step: asking_name
✅ [GOAL COMPLETADO] Nombre: Juan Pérez
🎯 [GOALS] Procesando step: asking_email
✅ [GOAL COMPLETADO] Email: juan@ejemplo.com
⏭️  [GOAL SKIPPED] Teléfono: usuario optó por saltear
🎯 [GOALS] Procesando step: asking_project
✅ [GOAL COMPLETADO] Proyecto: Necesito un e-commerce...
🎯 [GOALS] ✅ TODOS LOS GOALS COMPLETADOS - Email se enviará
📧 [LEAD] 🎯 Todos los goals completados - Iniciando envío...
📧 [API] Validando datos antes de enviar...
📧 [API] Datos validados, enviando a /api/lead...
📧 [API] Respuesta del servidor: 200 OK
✅ [API] Lead guardado exitosamente: lead-abc123
✅ [API] Email enviado a: patriciomillan10@gmail.com
```

## Ventajas de esta Arquitectura

1. **Separación de Concerns**: Cada servicio tiene una responsabilidad clara
2. **Validación Robusta**: Cada goal se valida independientemente
3. **Debugging Fácil**: Logs detallados en cada paso
4. **Mantenibilidad**: Agregar/quitar goals es simple
5. **UX Profesional**: El usuario nunca ve errores técnicos
6. **Garantía de Datos**: El email solo se envía si TODOS los datos están completos

## Modificar Goals

Para agregar un nuevo goal obligatorio (ej: "empresa"):

1. **`lead-goals-service.ts`**: Agregar 'empresa' a `REQUIRED_GOALS`
2. **`lead-flow.ts`**: Agregar `empresa?: string` al type `LeadFlowData`
3. **`lead-flow-service.ts`**: Agregar case `asking_company` en `processUserResponse()`
4. **`lead-flow-service.ts`**: Agregar paso en `getNextQuestion()`

## Testing

Usar el script `test-lead-flow.mjs` para probar el flujo completo:

```bash
node test-lead-flow.mjs
```

Este script simula:
1. Una conversación completa
2. Envío de todos los datos
3. Verificación del email
4. Verificación del guardado en data/leads.json
