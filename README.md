# 🤖 Chatbot con IA - Next.js & OpenAI

Chatbot inteligente con interfaz moderna construido con Next.js 16, OpenAI GPT-4o, shadcn/ui y Tailwind CSS.

## 🚀 Características

- ✅ Chat en tiempo real con streaming de respuestas
- ✅ Interfaz moderna con tema oscuro
- ✅ Integración con OpenAI GPT-4o
- ✅ **Sistema automático de captura de leads**
- ✅ **Envío de emails con notificación de nuevos clientes**
- ✅ Rate limiting (10 mensajes/minuto)
- ✅ Validación de entradas y sanitización
- ✅ Clean Architecture (Uncle Bob)
- ✅ TypeScript & SOLID principles

## 📋 Requisitos

- Node.js 18+ 
- npm, yarn, pnpm o bun
- Cuenta de OpenAI (para API key)

## ⚙️ Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/patohed/web-chatbot-shadcn.git
cd web-chatbot-shadcn
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env.local` en la raíz del proyecto:

```env
# OpenAI
OPENAI_API_KEY=tu-api-key-aqui

# Email - Resend (para sistema de leads)
RESEND_API_KEY=tu-resend-api-key
EMAIL_FROM=onboarding@resend.dev
EMAIL_TO=millanpatricio@hotmail.com

# reCAPTCHA (opcional - deshabilitado por defecto para pruebas)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu-site-key
RECAPTCHA_SECRET_KEY=tu-secret-key
```

4. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🔑 Obtener API Key de OpenAI

1. Ve a [platform.openai.com](https://platform.openai.com/)
2. Inicia sesión o crea una cuenta
3. Ve a **API Keys** en el menú
4. Crea una nueva API key
5. Cópiala y pégala en tu archivo `.env.local`

## 📧 Configurar Resend para Emails

1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta (gratis - 3,000 emails/mes)
3. Ve a **API Keys** y crea una nueva
4. Agrégala a `.env.local` como `RESEND_API_KEY`
5. Configura `EMAIL_TO` con el email donde quieras recibir leads

> **Nota**: En desarrollo usa `onboarding@resend.dev`. En producción, verifica tu dominio en Resend.

## 🎨 Personalización

### Modificar el prompt del bot

Edita el archivo `lib/prompts/system-prompt.ts` para cambiar la personalidad y comportamiento del bot.

### Cambiar el modelo de IA

Edita `lib/config.ts` y cambia el valor de `model`:

```typescript
model: 'gpt-4o', // o 'gpt-4', 'gpt-3.5-turbo', etc.
```

### Ajustar rate limiting

Edita `lib/config.ts`:

```typescript
rateLimit: {
  points: 10, // Cantidad de mensajes
  duration: 60, // Por cada 60 segundos
}
```

## 🎯 Sistema de Captura de Leads

El bot detecta automáticamente cuando un cliente muestra interés y activa un flujo de cierre que:

1. Solicita datos del cliente (nombre, email, teléfono, proyecto)
2. Muestra un formulario modal elegante
3. Guarda el lead en `/data/leads.json`
4. Envía un email detallado con toda la información

**Ver documentación completa**: [SISTEMA-LEADS.md](./SISTEMA-LEADS.md)

## 📦 Producción

### Build local
```bash
npm run build
npm start
```

### Deploy en Vercel

1. Sube tu código a GitHub
2. Importa el proyecto en [vercel.com](https://vercel.com)
3. Configura las variables de entorno
4. Deploy automático ✨

## 🛠️ Tecnologías

- **Framework**: Next.js 16 (App Router)
- **IA**: OpenAI GPT-4o
- **UI**: Tailwind CSS v4 + shadcn/ui
- **TypeScript**: Para type safety
- **Arquitectura**: Clean Architecture + SOLID

## 📝 Estructura del proyecto

```
├── app/
│   ├── api/chat/          # Endpoint de la API
│   └── page.tsx           # Página principal
├── components/            # Componentes UI
├── lib/
│   ├── services/          # Servicios (IA, rate limit, etc.)
│   ├── use-cases/         # Lógica de negocio
│   ├── factories/         # Dependency injection
│   └── prompts/           # Prompts del sistema
└── types/                 # Tipos TypeScript
```

## 🔒 Seguridad

- ✅ Validación y sanitización de inputs
- ✅ Rate limiting por usuario
- ✅ Headers de seguridad (XSS, CSRF, etc.)
- ✅ No expone errores internos
- ✅ API keys en variables de entorno

## 📄 Licencia

MIT

---

Desarrollado por [PmDevOps](https://www.pmdevop.com)
