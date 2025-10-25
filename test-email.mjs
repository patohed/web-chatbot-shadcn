import { Resend } from 'resend';
import { readFileSync } from 'fs';

// Leer variables de entorno desde .env.local
const envFile = readFileSync('.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const testEmail = async () => {
  console.log('🧪 Testing Resend Email Service...\n');
  
  const apiKey = envVars.RESEND_API_KEY || 're_BG7Q156z_Fijdb6mrdThxXKXT1ZiFZNjx';
  const fromEmail = envVars.EMAIL_FROM || 'onboarding@resend.dev';
  const toEmail = envVars.EMAIL_TO || 'patriciomillan10@gmail.com';

  console.log('📧 Configuración:');
  console.log('- API Key:', apiKey ? '✅ Configurado' : '❌ Falta');
  console.log('- From:', fromEmail);
  console.log('- To:', toEmail);
  console.log('\n');

  try {
    const resend = new Resend(apiKey);
    
    console.log('📤 Enviando email de prueba...\n');
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: '🧪 Test - Chatbot Lead System',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #8b5cf6;">🧪 Email de Prueba</h1>
            <p>Este es un email de prueba del sistema de captura de leads.</p>
            <hr>
            <h2>📋 Datos del Lead de Prueba:</h2>
            <ul>
              <li><strong>Nombre:</strong> Juan Pérez TEST</li>
              <li><strong>Email:</strong> juan.test@ejemplo.com</li>
              <li><strong>Teléfono:</strong> +54 9 11 1234-5678</li>
              <li><strong>Proyecto:</strong> E-commerce con pasarela de pago</li>
            </ul>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Si recibiste este email, el sistema de notificaciones está funcionando correctamente ✅
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error de Resend:', error);
      console.error('\n📝 Detalles del error:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ Email enviado exitosamente!');
    console.log('📧 ID del email:', data?.id);
    console.log('\n');
    console.log('✅ Test completado!');
    console.log('📬 Verifica tu bandeja de entrada en:', toEmail);
    console.log('⚠️  Si no lo ves, revisa la carpeta de SPAM');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n📝 Stack:', error.stack);
  }
};

testEmail();
