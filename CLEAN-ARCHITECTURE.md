# 🏗️ Clean Architecture Implementation

## Estructura del Proyecto

```
lib/
├── config.ts                    # Configuración centralizada
├── prompts/
│   └── system-prompt.ts        # Prompt del sistema (separado del código)
├── services/                    # Infrastructure Layer
│   ├── ai-service.ts           # Servicio de OpenAI
│   ├── rate-limit-service.ts  # Rate limiting
│   ├── captcha-service.ts     # Verificación de CAPTCHA
│   └── validation-service.ts  # Validación de inputs
├── use-cases/                   # Application Layer
│   └── chat-use-case.ts        # Caso de uso principal
├── factories/                   # Dependency Injection
│   └── chat-factory.ts         # Factory para crear use cases
types/
├── domain.ts                    # Tipos del dominio
└── index.d.ts                   # Tipos globales (deprecated)
app/
└── api/
    └── chat/
        └── route.ts             # API endpoint (Presentation Layer)
components/                      # UI Layer
├── chatbox.tsx
├── chat-form.tsx
└── mensaje.tsx
```

---

## Capas de Clean Architecture

### 1. **Domain Layer** (types/domain.ts)
- Entidades y tipos de negocio
- Sin dependencias externas
- Reglas de negocio puras

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}
```

### 2. **Application Layer** (use-cases/)
- Casos de uso de la aplicación
- Orquesta los servicios
- Lógica de negocio específica

```typescript
class ChatUseCase {
  async execute(message, captcha, userId) {
    // 1. Validar
    // 2. Verificar captcha
    // 3. Rate limiting
    // 4. Procesar con IA
  }
}
```

### 3. **Infrastructure Layer** (services/)
- Implementaciones concretas
- Comunicación con APIs externas
- Persistencia (futuro)

### 4. **Presentation Layer** (app/api/, components/)
- HTTP handlers
- UI components
- Adaptadores de entrada/salida

---

## Principios SOLID Aplicados

### ✅ **Single Responsibility Principle**
Cada clase tiene una única responsabilidad:
- `AIService` → Solo IA
- `RateLimitService` → Solo rate limiting
- `ValidationService` → Solo validación

### ✅ **Open/Closed Principle**
Servicios abiertos para extensión, cerrados para modificación:
```typescript
// Fácil agregar nuevos servicios sin modificar ChatUseCase
class ChatUseCase {
  constructor(
    private aiService: AIService,
    private newService: NewService // ← Extensión
  ) {}
}
```

### ✅ **Liskov Substitution Principle**
Interfaces claras que pueden ser intercambiadas:
```typescript
// Puedes cambiar OpenAI por Claude sin cambiar ChatUseCase
interface IAIService {
  generateStream(message: Message): Promise<ReadableStream>;
}
```

### ✅ **Interface Segregation Principle**
Interfaces específicas en lugar de interfaces grandes

### ✅ **Dependency Inversion Principle**
Dependencias via inyección, no instanciación directa:
```typescript
// ❌ Mal
class ChatUseCase {
  constructor() {
    this.aiService = new AIService(); // Acoplamiento
  }
}

// ✅ Bien
class ChatUseCase {
  constructor(private aiService: AIService) {} // Inyección
}
```

---

## Seguridad Implementada

### 🔒 **1. No Exponer Datos Sensibles**

**ANTES:**
```typescript
❌ console.error(error); // Expone stack traces
❌ return { error: error.message }; // Detalla internos
```

**AHORA:**
```typescript
✅ console.error('[Service] Error:', sanitizeError(error));
✅ return { error: 'Error procesando tu mensaje' };
```

### 🔒 **2. Validación de Inputs**

```typescript
✅ Longitud máxima/mínima
✅ Sanitización de caracteres peligrosos
✅ Type checking estricto
✅ Validación de tokens
```

### 🔒 **3. Headers de Seguridad**

```typescript
'X-Content-Type-Options': 'nosniff'
'X-Frame-Options': 'DENY'
'X-XSS-Protection': '1; mode=block'
```

### 🔒 **4. Configuración Centralizada**

```typescript
// config.ts
✅ Variables de entorno validadas
✅ Valores por defecto seguros
✅ Validación al inicio
```

### 🔒 **5. Rate Limiting Robusto**

```typescript
✅ Por IP (en producción)
✅ Configurable
✅ Mensajes de error informativos
```

---

## Buenas Prácticas Aplicadas

### ✅ **Separation of Concerns**
- Prompt separado del código (system-prompt.ts)
- Configuración centralizada (config.ts)
- Lógica de negocio separada de infraestructura

### ✅ **Dependency Injection**
- Factory pattern para crear instancias
- No hay `new` en use cases
- Fácil testing y mocking

### ✅ **Error Handling**
```typescript
✅ Try-catch en todos los servicios
✅ Errores sanitizados
✅ Logging con contexto [Service]
✅ No exponer stack traces
```

### ✅ **Type Safety**
```typescript
✅ TypeScript estricto
✅ Interfaces claras
✅ No usar 'any'
✅ Validation runtime + compile time
```

### ✅ **Testability**
```typescript
// Fácil de testear
const mockAIService = { generateStream: jest.fn() };
const useCase = new ChatUseCase(mockAIService, ...);
```

---

## Cómo Extender

### Agregar Nuevo Servicio

1. **Crear servicio** (lib/services/)
```typescript
export class NewService {
  async doSomething() { ... }
}
```

2. **Agregar al use case**
```typescript
constructor(
  private aiService: AIService,
  private newService: NewService // ← Aquí
) {}
```

3. **Actualizar factory**
```typescript
static create() {
  const newService = new NewService();
  return new ChatUseCase(aiService, newService);
}
```

### Agregar Persistencia (DB)

1. Crear `lib/services/database-service.ts`
2. Agregar método `saveConversation()`
3. Llamar desde `ChatUseCase.execute()`
4. ¡Listo! Sin tocar otros servicios

---

## Beneficios de Esta Arquitectura

### ✅ **Mantenibilidad**
- Código organizado y predecible
- Fácil encontrar y modificar funcionalidades

### ✅ **Testability**
- Cada capa se testea independientemente
- Mocking sencillo

### ✅ **Escalabilidad**
- Agregar features sin romper existentes
- Cambiar implementaciones fácilmente

### ✅ **Seguridad**
- Validación en capas
- Errores controlados
- Sin exposición de datos sensibles

### ✅ **Legibilidad**
- Código auto-documentado
- Responsabilidades claras
- Flujo lógico evidente

---

## Comparación: Antes vs Ahora

### ❌ **ANTES (Anti-patterns)**

```typescript
// Código monolítico
"use server"
export async function crearRespuesta(mensaje: MessageProps) {
  // Rate limit aquí ❌
  // Captcha aquí ❌
  // Validación aquí ❌
  // IA aquí ❌
  // Todo mezclado ❌
}
```

### ✅ **AHORA (Clean Architecture)**

```typescript
// Separación de responsabilidades
const chatUseCase = ChatUseCaseFactory.create();
const result = await chatUseCase.execute(message, captcha, userId);

// Cada servicio hace UNA cosa
// Fácil testear, extender, mantener
```

---

## Testing (Ejemplo)

```typescript
describe('ChatUseCase', () => {
  it('should validate message before processing', async () => {
    const mockValidation = {
      validateMessage: jest.fn(() => ({ isValid: false }))
    };
    
    const useCase = new ChatUseCase(
      mockAI,
      mockRateLimit,
      mockCaptcha,
      mockValidation
    );
    
    const result = await useCase.execute(message, token, user);
    
    expect(result.success).toBe(false);
    expect(mockAI.generateStream).not.toHaveBeenCalled();
  });
});
```

---

## Checklist de Seguridad

- [x] ✅ Variables de entorno no expuestas al cliente
- [x] ✅ API keys validadas al inicio
- [x] ✅ Errores sanitizados (no stack traces)
- [x] ✅ Inputs validados (longitud, caracteres)
- [x] ✅ Rate limiting implementado
- [x] ✅ CAPTCHA verificado server-side
- [x] ✅ Headers de seguridad (XSS, nosniff, etc)
- [x] ✅ Type checking estricto
- [x] ✅ No usar 'any'
- [x] ✅ Logging sin datos sensibles

---

## Próximos Pasos Recomendados

1. **Testing**
   - Unit tests para servicios
   - Integration tests para use cases
   - E2E tests para API

2. **Monitoring**
   - Logger service (Winston, Pino)
   - APM (Application Performance Monitoring)
   - Error tracking (Sentry)

3. **Persistencia**
   - Database service
   - Guardar conversaciones
   - Analytics

4. **Cache**
   - Redis para rate limiting distribuido
   - Cache de respuestas comunes

---

*Implementado según principios de Clean Architecture de Uncle Bob*
*Versión: 3.0 - Production Ready + Clean Architecture*
