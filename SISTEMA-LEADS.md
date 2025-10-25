# 🎯 Sistema de Cierre de Ventas y Captura de Leads

## 📋 Descripción

El chatbot ahora cuenta con un sistema automático de detección de intención de compra y captura de leads que:

1. **Detecta** cuando un cliente muestra interés real en contratar
2. **Solicita** información del cliente de forma natural
3. **Captura** los datos en un formulario intuitivo
4. **Guarda** el lead localmente (archivo JSON)
5. **Envía** un email detallado a `millanpatricio@hotmail.com`

## 🚀 Cómo Funciona

### 1. Detección Automática

El bot detecta frases como:
- "me interesa"
- "quiero contratar"
- "dame presupuesto"
- "hagámoslo"
- "necesito tu servicio"

Cuando detecta interés, activa el **flujo de cierre**.

### 2. Solicitud de Datos

El bot pedirá **de forma natural** en la conversación:
- Nombre completo
- Email
- Teléfono (opcional)
- Descripción del proyecto

### 3. Formulario Modal

Cuando el bot menciona palabras clave como:
- "necesito algunos datos"
- "completá tus datos"
- "para avanzar con tu proyecto"

Se abre automáticamente un **formulario modal** con:
- ✅ Validación de email
- ✅ Campos obligatorios marcados
- ✅ Diseño moderno acorde al chatbot
- ✅ Botón de cancelar por si el usuario cambia de opinión

### 4. Almacenamiento

Los leads se guardan en:
```
/data/leads.json
```

Formato:
```json
{
  "id": "uuid-generado",
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "telefono": "+54 9 11 1234-5678",
  "proyecto": "Necesito un e-commerce...",
  "conversacion": ["Cliente: ...", "Bot: ..."],
  "fechaCreacion": "2025-10-25T..."
}
```

### 5. Notificación por Email

Se envía un email HTML hermoso a `millanpatricio@hotmail.com` con:
- 📧 Información del cliente (nombre, email, teléfono)
- 💼 Descripción del proyecto
- 📝 Contexto completo de la conversación
- 🔗 Botón para responder directamente al cliente
- 🆔 ID único del lead

## ⚙️ Configuración

### Variables de Entorno Necesarias

```env
# API Key de Resend (para envío de emails)
RESEND_API_KEY=re_tuApiKey

# Email desde donde se envían (debe estar verificado en Resend)
EMAIL_FROM=onboarding@resend.dev

# Email destino (donde recibirás los leads)
EMAIL_TO=millanpatricio@hotmail.com
```

### Obtener API Key de Resend

1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta (gratis - 3,000 emails/mes)
3. Ve a **API Keys**
4. Crea una nueva API key
5. Cópiala en tu `.env.local`

**IMPORTANTE**: Para producción, necesitas verificar tu dominio en Resend y cambiar `EMAIL_FROM` a `tu-email@tudominio.com`

## 🎨 Personalización

### Modificar el Email Template

Edita el archivo:
```
lib/services/email-service.ts
```

Busca el método `sendLeadNotification` y modifica el HTML.

### Cambiar Palabras Clave de Detección

Edita el archivo:
```
components/chatbox.tsx
```

Busca el array `palabrasClaveCierre` y agrega/modifica las frases.

### Ajustar el Prompt de Cierre

Edita el archivo:
```
lib/prompts/system-prompt.ts
```

Busca la sección "🎯 FLUJO DE CIERRE DE VENTAS" y personaliza.

## 📊 Ver Leads Capturados

Los leads se guardan en:
```
/data/leads.json
```

Puedes crear un dashboard simple o consultarlos directamente del archivo.

### Ejemplo: Leer leads con Node.js

```javascript
const fs = require('fs');
const leads = JSON.parse(fs.readFileSync('./data/leads.json', 'utf-8'));
console.log(`Total leads: ${leads.length}`);
```

## 🔒 Seguridad

- ✅ Validación de email con regex
- ✅ Campos obligatorios verificados
- ✅ Conversación completa guardada como contexto
- ✅ Archivo `leads.json` excluido de Git
- ✅ Sanitización de inputs antes de guardar

## 🚀 En Producción (Netlify)

Para producción en Netlify, considera:

### Opción 1: Netlify Forms (Recomendado)
- Sin necesidad de backend
- Formularios nativos de Netlify
- Notificaciones automáticas

### Opción 2: Base de Datos
- PostgreSQL (Vercel Postgres, Supabase)
- MongoDB (MongoDB Atlas)
- Redis (Upstash)

### Opción 3: Google Sheets
- API de Google Sheets
- Fácil de consultar
- Sin base de datos

## 📈 Métricas Sugeridas

Considera trackear:
- ✅ Cantidad de leads por día
- ✅ Tasa de conversión (visitantes → leads)
- ✅ Proyectos más solicitados
- ✅ Tasa de respuesta de emails
- ✅ Tiempo promedio hasta el cierre

## 🎯 Roadmap Futuro

- [ ] Dashboard de administración
- [ ] Integración con CRM (HubSpot, Pipedrive)
- [ ] Webhooks para notificaciones en Slack/Telegram
- [ ] Auto-respuesta por email
- [ ] Scoring automático de leads
- [ ] A/B testing de prompts de cierre

---

**¿Dudas?** Consultá la documentación de cada servicio o preguntale al bot 😉
