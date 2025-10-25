# Chatbot con OpenAI API - Next.js

Este es un proyecto completo de chatbot usando OpenAI API en Next.js con TypeScript, Tailwind CSS y Shadcn/ui.

## Stack Tecnológico

- **Next.js** con TypeScript
- **Tailwind CSS**
- **Shadcn/ui** para componentes
- **OpenAI API** (modelo gpt-4o-mini)
- **React Hook Form** con Zod para validación
- **React Markdown** para renderizado de respuestas

## Estructura del Proyecto

```
bot-web-shadc/
├── app/
│   ├── page.tsx (página principal)
│   └── globals.css
├── components/
│   ├── chatbox.tsx
│   ├── chat-form.tsx
│   └── mensaje.tsx
├── components/ui/ (generados por shadcn)
│   ├── button.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   └── label.tsx
├── lib/
│   ├── actions-open.ts
│   └── utils.ts
├── types/
│   └── index.d.ts
├── .env.local
└── package.json
```

## Configuración

### 1. Variables de Entorno

Edita el archivo `.env.local` y agrega tu clave de API de OpenAI:

```env
OPENAI_API_KEY=tu_api_key_aqui
```

Para obtener tu API key:
1. Ve a https://platform.openai.com/
2. Inicia sesión o crea una cuenta
3. Ve a "API keys" en tu perfil
4. Crea una nueva clave secreta
5. Copia y pégala en `.env.local`

### 2. Instalar Dependencias (Ya instaladas)

Las dependencias ya están instaladas, pero si necesitas reinstalarlas:

```bash
npm install
```

### 3. Ejecutar el Proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Características

- ✅ Interfaz de chat moderna y responsive
- ✅ Integración con OpenAI GPT-4o-mini
- ✅ Renderizado de Markdown en respuestas de la IA
- ✅ Indicador de carga mientras la IA responde
- ✅ Envío de mensajes con Enter (Shift+Enter para nueva línea)
- ✅ Historial de conversación persistente en la sesión
- ✅ Validación de formularios con Zod
- ✅ Diseño con Tailwind CSS y componentes Shadcn/ui

## Componentes Principales

### `chatbox.tsx`
Componente principal que maneja el estado del chat y la comunicación con la API de OpenAI.

### `chat-form.tsx`
Formulario para enviar mensajes con validación y manejo de teclas.

### `mensaje.tsx`
Componente para renderizar cada mensaje del chat (usuario o IA).

### `actions-open.ts`
Acción del servidor que maneja las llamadas a la API de OpenAI.

## Uso

1. Escribe tu pregunta o mensaje en el área de texto
2. Presiona Enter o haz clic en el botón de enviar
3. Espera la respuesta de ChatGPT
4. La respuesta se formateará con Markdown automáticamente

## Tecnologías Utilizadas

- **Next.js 16**: Framework de React con renderizado del lado del servidor
- **TypeScript**: Tipado estático para JavaScript
- **Tailwind CSS**: Framework de CSS utilitario
- **Shadcn/ui**: Biblioteca de componentes UI
- **OpenAI API**: Modelo GPT-4o-mini para generación de respuestas
- **React Hook Form**: Manejo de formularios
- **Zod**: Validación de esquemas
- **React Markdown**: Renderizado de Markdown
- **Lucide React**: Iconos

## Notas

- El chatbot está configurado como "programador experto en Next.js"
- Puedes modificar el prompt del sistema en `lib/actions-open.ts`
- El historial del chat se mantiene mientras la sesión esté activa
- Los mensajes se reinician al recargar la página

## Licencia

MIT
