# 🏗️ CLEAN ARCHITECTURE - FLUJO DE CIERRE

## Uncle Bob's Principles Aplicados

Este documento explica cómo se implementó el flujo de cierre siguiendo los principios de **Clean Architecture** de Robert C. Martin (Uncle Bob) con manejo correcto de **async/await** sin promises anidadas.

## 🎯 Flujo Completo

```
DISPARADOR DETECTADO
       ↓
ARQUITECTURA GOALS ACTIVADA
       ↓
CONDICIÓN DE GOALS CUMPLIDA
       ↓
EMAIL ENVIADO
```

## 📐 Arquitectura en Capas

### **Capa 1: Presentación (UI)**
- **Archivo**: `components/chatbox.tsx`
- **Responsabilidad**: Manejar interacción del usuario y actualizar UI
- **Principio**: Single Responsibility - Solo coordina, no contiene lógica de negocio

### **Capa 2: Orquestación**
- **Archivo**: `lib/orchestrators/close-sale-orchestrator.ts`
- **Responsabilidad**: Coordinar el flujo completo de cierre
- **Principio**: Dependency Inversion - Depende de abstracciones (servicios), no de implementaciones concretas

### **Capa 3: Servicios**
- **LeadFlowService**: Maneja el flujo conversacional
- **LeadGoalsService**: Gestiona el estado de los goals
- **Responsabilidad**: Lógica de dominio específica
- **Principio**: Open/Closed - Abierto para extensión, cerrado para modificación

### **Capa 4: Casos de Uso**
- **Archivo**: `lib/use-cases/close-sale-use-case.ts`
- **Responsabilidad**: Lógica de negocio (guardar lead + enviar email)
- **Principio**: Single Responsibility - Una única razón para cambiar

### **Capa 5: Infraestructura**
- **EmailService**: Integración con Resend
- **LeadService**: Persistencia en JSON
- **Responsabilidad**: Detalles de implementación
- **Principio**: Dependency Inversion - Implementan interfaces definidas por capas superiores

## 🔄 Flujo Detallado con Clean Async/Await

### PASO 1: Usuario envía mensaje

```typescript
// components/chatbox.tsx
const handleUserMessage = async (content: string): Promise<void> => {
  try {
    // 1. Agregar mensaje a UI (síncrono)
    const userMessage: Message = { role: 'user', content, timestamp: new Date() };
    setChatHistoria(prev => [...prev, userMessage]);
    
    // 2. Actualizar conversación
    const updatedConversacion = [...leadFlowState.conversacion, `Cliente: ${content}`];
    setLeadFlowState(prev => ({ ...prev, conversacion: updatedConversacion }));
    
    // 3. DECISIÓN: ¿Flujo activo o nuevo?
    if (leadFlowState.step !== 'idle' && leadFlowState.step !== 'completed') {
      // Flujo activo → procesar goal
      await handleActiveCloseSaleFlow(content, updatedConversacion);
      return; // Early return
    }
    
    if (leadFlowState.step === 'idle') {
      // Detectar disparador
      const triggerResult = await closeSaleOrchestrator.current.detectTrigger(
        content,
        updatedConversacion,
        leadFlowState
      );
      
      // Early return si se activó flujo
      if (triggerResult.triggered) {
        setLeadFlowState(triggerResult.initialState!);
        setChatHistoria(prev => [...prev, triggerResult.initialMessage!]);
        return;
      }
    }
    
    // Flujo normal con IA
    await handleAIResponse(content);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Principios aplicados:**
- ✅ Early Returns: Sale rápido en cada condición
- ✅ Single Responsibility: Cada bloque hace una cosa
- ✅ No promises anidadas: Todo es await secuencial
- ✅ Clean código: Fácil de leer y mantener

### PASO 2: Orquestador detecta disparador

```typescript
// lib/orchestrators/close-sale-orchestrator.ts
async detectTrigger(
  userMessage: string,
  conversationContext: string[],
  currentState: LeadFlowState
): Promise<TriggerDetectionResult> {
  
  // Early return si ya hay flujo activo
  if (currentState.step !== 'idle') {
    return { triggered: false };
  }
  
  // Delegar detección al servicio
  const hasIntent = this.leadFlowService.detectPurchaseIntent(
    userMessage,
    conversationContext
  );
  
  // Early return si no hay intención
  if (!hasIntent) {
    return { triggered: false };
  }
  
  // Extraer contexto
  const proyectoContext = this.leadFlowService.extractProjectDescription(conversationContext);
  
  // Obtener primera pregunta
  const firstQuestion = this.leadFlowService.getNextQuestion('idle', currentState);
  
  // Early return si error
  if (!firstQuestion) {
    return { triggered: false };
  }
  
  // Crear estado inicial
  const initialState: LeadFlowState = {
    step: firstQuestion.step,
    data: { proyecto: proyectoContext },
    conversacion: conversationContext,
    startedAt: new Date(),
  };
  
  return {
    triggered: true,
    initialState,
    initialMessage: { role: 'assistant', content: firstQuestion.question, timestamp: new Date() },
  };
}
```

**Principios aplicados:**
- ✅ Dependency Injection: Recibe servicios en constructor
- ✅ Early Returns: Sale rápido en cada validación
- ✅ Single Responsibility: Solo coordina, no implementa lógica
- ✅ Clean código: Fácil de testear (solo inyectar mocks)

### PASO 3: Procesar respuesta y validar goals

```typescript
// lib/orchestrators/close-sale-orchestrator.ts
async processGoalResponse(
  userMessage: string,
  currentState: LeadFlowState
): Promise<CloseSaleResult> {
  
  // Delegar procesamiento al servicio
  const { newState, botResponse, shouldSendLead, validationError } =
    this.leadFlowService.processUserResponse(userMessage, currentState);
  
  // Early return si hay error de validación
  if (validationError) {
    return {
      success: false,
      newState: currentState, // No cambiar estado
      botMessage: { role: 'assistant', content: validationError, timestamp: new Date() },
      shouldUpdateUI: true,
      error: validationError,
    };
  }
  
  // Early return si no hay respuesta
  if (!botResponse) {
    return {
      success: false,
      newState,
      shouldUpdateUI: false,
      error: 'Error interno',
    };
  }
  
  // Crear mensaje del bot
  const botMessage: Message = {
    role: 'assistant',
    content: botResponse,
    timestamp: new Date(),
  };
  
  // Verificar si todos los goals están completos
  if (shouldSendLead) {
    console.log('✅ TODOS LOS GOALS COMPLETADOS');
    // El envío se maneja en el componente
  }
  
  return {
    success: true,
    newState,
    botMessage,
    shouldUpdateUI: true,
  };
}
```

**Principios aplicados:**
- ✅ Separation of Concerns: Orquestador coordina, servicio valida
- ✅ Early Returns: Sale rápido en errores
- ✅ Immutability: No muta el estado original si hay error
- ✅ Clean código: Resultado explícito con tipos

### PASO 4: Componente maneja el resultado

```typescript
// components/chatbox.tsx
const handleActiveCloseSaleFlow = async (
  content: string,
  conversacion: string[]
): Promise<void> => {
  
  // Procesar con orchestrator
  const result = await closeSaleOrchestrator.current.processGoalResponse(
    content,
    { ...leadFlowState, conversacion }
  );
  
  // Early return si hay error
  if (!result.success) {
    if (result.botMessage) {
      setChatHistoria(prev => [...prev, result.botMessage!]);
    }
    return;
  }
  
  // Actualizar estado
  setLeadFlowState(result.newState);
  
  // Mostrar mensaje del bot
  if (result.botMessage && result.shouldUpdateUI) {
    setChatHistoria(prev => [...prev, result.botMessage!]);
  }
  
  // Verificar si goals completos
  const allGoalsCompleted = closeSaleOrchestrator.current.canSendLead(result.newState);
  
  // Enviar lead si completo
  if (allGoalsCompleted) {
    await sendLeadViaOrchestrator(result.newState);
  }
};
```

**Principios aplicados:**
- ✅ No blocking UI: Cada await es necesario y secuencial
- ✅ Early Returns: Sale rápido en errores
- ✅ Clean async/await: Sin .then() ni promises anidadas
- ✅ Separation of Concerns: UI solo actualiza estado, no valida

### PASO 5: Enviar lead al API

```typescript
// components/chatbox.tsx
const sendLeadViaOrchestrator = async (flowState: LeadFlowState): Promise<void> => {
  try {
    const result = await closeSaleOrchestrator.current.sendLeadToAPI(flowState);
    
    // Early return si hay error
    if (!result.success) {
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Guardé tu información pero hubo un problema...',
        timestamp: new Date(),
      };
      setChatHistoria(prev => [...prev, errorMsg]);
      return;
    }
    
    // Success!
    console.log('✅ Lead enviado:', result.leadId);
  } catch (error) {
    console.error('Exception:', error);
    // Mostrar error al usuario
  }
};
```

**Principios aplicados:**
- ✅ Try/Catch solo donde se necesita
- ✅ Early Return en error
- ✅ No blocking: await solo cuando es necesario
- ✅ Clean código: Fácil de seguir el flujo

## 🎯 Ventajas de esta Arquitectura

### 1. **Testeable**
Cada capa se puede testear independientemente:
```typescript
// Test del orchestrator
const mockLeadFlowService = new MockLeadFlowService();
const mockGoalsService = new MockLeadGoalsService();
const orchestrator = new CloseSaleOrchestrator(mockLeadFlowService, mockGoalsService);

// Test aislado
const result = await orchestrator.detectTrigger('quiero contratar', [], initialState);
expect(result.triggered).toBe(true);
```

### 2. **Mantenible**
Cambiar una pieza no afecta las demás:
- Cambiar validación de goals → Solo editar `LeadGoalsService`
- Cambiar preguntas del flujo → Solo editar `LeadFlowService`
- Cambiar servicio de email → Solo editar `EmailService`

### 3. **Sin Async/Await Hell**
Antes (MAL):
```typescript
fetch('/api/lead')
  .then(response => response.json())
  .then(data => {
    sendEmail(data)
      .then(result => {
        saveLead(result)
          .then(() => console.log('done'))
          .catch(error => console.error(error))
      })
      .catch(error => console.error(error))
  })
  .catch(error => console.error(error));
```

Ahora (BIEN):
```typescript
const response = await fetch('/api/lead');
if (!response.ok) return; // Early return

const data = await response.json();
const emailResult = await sendEmail(data);
if (!emailResult.success) return; // Early return

await saveLead(emailResult);
console.log('done');
```

### 4. **Early Returns everywhere**
Cada función sale rápido en caso de error, sin nesting:
```typescript
// ✅ BIEN
async function processLead(data) {
  if (!data.nombre) return { success: false, error: 'Falta nombre' };
  if (!data.email) return { success: false, error: 'Falta email' };
  if (!data.proyecto) return { success: false, error: 'Falta proyecto' };
  
  const result = await saveLead(data);
  return { success: true, leadId: result.id };
}

// ❌ MAL
async function processLead(data) {
  if (data.nombre) {
    if (data.email) {
      if (data.proyecto) {
        const result = await saveLead(data);
        return { success: true, leadId: result.id };
      } else {
        return { success: false, error: 'Falta proyecto' };
      }
    } else {
      return { success: false, error: 'Falta email' };
    }
  } else {
    return { success: false, error: 'Falta nombre' };
  }
}
```

### 5. **Dependency Injection**
Servicios inyectados, no hardcodeados:
```typescript
// ✅ BIEN - Inyección de dependencias
class CloseSaleOrchestrator {
  constructor(
    private leadFlowService: LeadFlowService,
    private goalsService: LeadGoalsService
  ) {}
}

// ❌ MAL - Dependencias hardcodeadas
class CloseSaleOrchestrator {
  processLead() {
    const leadService = new LeadService(); // Hardcoded!
    const emailService = new EmailService(); // Hardcoded!
  }
}
```

## 📊 Estructura Final

```
components/
  └── chatbox.tsx                    # UI Layer - Solo coordina
lib/
  ├── orchestrators/
  │   └── close-sale-orchestrator.ts # Orchestration Layer
  ├── services/
  │   ├── lead-flow-service.ts       # Domain Service
  │   ├── lead-goals-service.ts      # Domain Service
  │   ├── email-service.ts           # Infrastructure Service
  │   └── lead-service.ts            # Infrastructure Service
  ├── use-cases/
  │   └── close-sale-use-case.ts     # Business Logic
  └── factories/
      └── lead-factory.ts            # Dependency Injection
```

## 🚀 Resultado

- ✅ **Código limpio**: Fácil de leer y entender
- ✅ **Testeable**: Cada capa se testea independientemente
- ✅ **Mantenible**: Cambios aislados por capa
- ✅ **Sin async hell**: Early returns y await secuenciales
- ✅ **SOLID principles**: Todos aplicados correctamente
- ✅ **Uncle Bob approved**: Clean Architecture al 100%
