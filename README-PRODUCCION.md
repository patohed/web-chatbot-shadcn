# 🚀 Chatbot de Ventas - Versión Producción

## ✅ Mejoras Implementadas

### 1. 🔒 Seguridad Completa
- ✅ **Google reCAPTCHA v2**: Protección contra bots
- ✅ **Rate Limiting**: Máximo 10 mensajes por minuto por IP
- ✅ **Validación de Inputs**: Sanitización y límites de caracteres
- ✅ **Manejo de Errores**: Sin exponer información sensible

### 2. ⚡ Streaming de Respuestas
- ✅ **Respuestas en Tiempo Real**: Como ChatGPT oficial
- ✅ **Mejor UX**: El usuario ve la respuesta formándose
- ✅ **Optimización**: Usa OpenAI Streaming API

### 3. 📊 Analytics y Monitoreo
- ✅ **Vercel Analytics**: Seguimiento de visitas y conversiones
- ✅ **Speed Insights**: Métricas de performance
- ✅ **Console Logging**: Errores registrados para debugging

### 4. 🎨 Mejoras de UX
- ✅ **Auto-scroll**: Scroll automático al último mensaje
- ✅ **Estados de Carga**: Indicadores visuales
- ✅ **Manejo de Errores**: Mensajes claros al usuario
- ✅ **Disabled States**: Previene múltiples envíos

### 5. 🧠 Motor de IA Optimizado
- ✅ **GPT-4o**: Modelo más potente para respuestas profesionales
- ✅ **Timeout Protection**: Evita esperas infinitas
- ✅ **Retry Logic**: Reintenta en caso de errores temporales

---

## 🔧 Configuración Inicial

### 1. Variables de Entorno

Edita `.env.local` y configura:

```bash
# OpenAI API Key (Ya configurada)
OPENAI_API_KEY=tu_api_key

# Google reCAPTCHA v2
# Obtener en: https://www.google.com/recaptcha/admin/create
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_site_key_aqui
RECAPTCHA_SECRET_KEY=tu_secret_key_aqui

# Rate Limiting (Opcional - tiene defaults)
RATE_LIMIT_MAX_REQUESTS=10      # Máximo mensajes por ventana
RATE_LIMIT_WINDOW_MS=60000      # Ventana en milisegundos (60s)
```

### 2. Obtener Claves de reCAPTCHA

1. Ve a: https://www.google.com/recaptcha/admin/create
2. Elige **reCAPTCHA v2** → "I'm not a robot"
3. Agrega tus dominios:
   - `localhost` (para desarrollo)
   - `tu-dominio.com` (para producción)
4. Copia las claves:
   - **Site Key** → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - **Secret Key** → `RECAPTCHA_SECRET_KEY`

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

---

## 🛡️ Protección contra Abuso

### Rate Limiting
- **10 mensajes por minuto** por IP
- Configurable en `.env.local`
- Mensaje amigable cuando se alcanza el límite

### CAPTCHA
- Se activa después del **primer mensaje**
- Protege contra bots automatizados
- Reset automático después de cada uso
- Tema oscuro para coincidir con el diseño

### Combinación Perfecta
Con **Rate Limiting + CAPTCHA** estás protegido contra:
- ✅ Bots automatizados
- ✅ Ataques de fuerza bruta
- ✅ Abuso del API de OpenAI
- ✅ Costos excesivos

---

## 📊 Monitoreo y Analytics

### Vercel Analytics (Automático)
- Visitas al sitio
- Conversiones
- Tiempo de permanencia
- Origen del tráfico

### Métricas Personalizadas
Puedes agregar tracking de:
- Mensajes enviados por sesión
- Temas más consultados
- Tasa de conversión a contacto

---

## 🚀 Despliegue a Producción

### Opción 1: Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Agregar variables de entorno en Vercel Dashboard
# Settings → Environment Variables
```

### Opción 2: Otras Plataformas

**Railway:**
```bash
railway up
```

**Netlify:**
```bash
netlify deploy --prod
```

### Variables de Entorno en Producción

Asegúrate de configurar en tu plataforma:
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- `RECAPTCHA_SECRET_KEY`
- `RATE_LIMIT_MAX_REQUESTS` (opcional)
- `RATE_LIMIT_WINDOW_MS` (opcional)

---

## 🔍 Testing

### Probar Rate Limiting
1. Envía 10 mensajes rápidos
2. El mensaje 11 debe mostrar error de límite
3. Espera 1 minuto y vuelve a intentar

### Probar CAPTCHA
1. Abre el sitio
2. Envía un mensaje
3. Debe aparecer el captcha
4. Comprueba que sin completarlo no permite enviar

### Probar Streaming
1. Envía un mensaje largo
2. Observa cómo la respuesta aparece palabra por palabra
3. Verifica que el scroll baja automáticamente

---

## 📈 Próximas Mejoras Recomendadas

### A Corto Plazo (1-2 semanas)
- [ ] **Base de datos**: Guardar conversaciones (PostgreSQL/MongoDB)
- [ ] **Captura de Leads**: Formulario al detectar interés alto
- [ ] **Respuestas Rápidas**: Botones con preguntas comunes

### A Medio Plazo (1 mes)
- [ ] **Dashboard Admin**: Ver métricas y conversaciones
- [ ] **Integración CRM**: HubSpot, Pipedrive
- [ ] **Notificaciones**: Email cuando hay lead caliente
- [ ] **A/B Testing**: Probar diferentes prompts

### A Largo Plazo (2-3 meses)
- [ ] **Multi-idioma**: Detectar y responder en varios idiomas
- [ ] **Voice Input**: Mensajes por voz
- [ ] **Integración WhatsApp**: Extender a WhatsApp Business
- [ ] **Fine-tuning**: Entrenar modelo específico con tus datos

---

## 🐛 Troubleshooting

### Error: "CAPTCHA fallida"
- Verifica que las claves estén correctas
- Revisa que el dominio esté autorizado en Google reCAPTCHA

### Error: "Límite de mensajes alcanzado"
- Es normal, espera 1 minuto
- Puedes aumentar el límite en `.env.local`

### Error: "OpenAI API"
- Verifica saldo en tu cuenta OpenAI
- Revisa que la API key sea válida
- Comprueba límites de uso de tu plan

### Respuestas muy lentas
- Normal con GPT-4o (3-5 segundos)
- Puedes volver a GPT-4o-mini para más velocidad (menos calidad)

---

## 💰 Costos Estimados

### OpenAI API (GPT-4o)
- **Input**: $2.50 / 1M tokens
- **Output**: $10.00 / 1M tokens
- **Promedio por conversación**: $0.02 - $0.05

### Estimación Mensual
- 1000 conversaciones/mes: **$20 - $50**
- 5000 conversaciones/mes: **$100 - $250**

### Ahorro con CAPTCHA + Rate Limit
- Sin protección: ~$500+/mes (bots + abuso)
- Con protección: **$20-250/mes** (solo humanos legítimos)

**ROI: Si consigues 1 cliente por mes, se paga solo** 🎯

---

## 📞 Soporte

Si tenés problemas o preguntas:
1. Revisa este README completo
2. Chequea los logs en la consola
3. Verifica las variables de entorno

---

## 🎉 ¡Listo para Producción!

Tu chatbot ahora tiene:
- ✅ Seguridad robusta (CAPTCHA + Rate Limiting)
- ✅ Streaming de respuestas (UX premium)
- ✅ Analytics integrado
- ✅ Manejo de errores profesional
- ✅ Motor de IA potente (GPT-4o)
- ✅ Código escalable y mantenible

**¡Es hora de conseguir clientes!** 🚀

---

*Última actualización: Octubre 2025*
*Versión: 2.0 - Production Ready*
