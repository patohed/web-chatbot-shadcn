// Infrastructure Layer - Servicio de Email
import { Resend } from 'resend';
import { Lead } from '@/types/lead';

export class EmailService {
  private resend: Resend;
  private fromEmail: string;
  private toEmail: string;

  constructor(apiKey: string, fromEmail: string, toEmail: string) {
    if (!apiKey) {
      throw new Error('Resend API key is required');
    }
    this.resend = new Resend(apiKey);
    this.fromEmail = fromEmail;
    this.toEmail = toEmail;
  }

  async sendLeadNotification(lead: Lead): Promise<{ success: boolean; error?: string }> {
    try {
      const conversacionHTML = lead.conversacion && lead.conversacion.length > 0
        ? `
          <h3 style="color: #8b5cf6; margin-top: 30px;">📝 Contexto de la conversación:</h3>
          <div style="background: #1f2937; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
            ${lead.conversacion.map(msg => `<p style="color: #e5e7eb; margin: 10px 0;">${msg}</p>`).join('')}
          </div>
        `
        : '';

      await this.resend.emails.send({
        from: this.fromEmail,
        to: this.toEmail,
        subject: `🎯 Nuevo Lead: ${lead.nombre}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <div style="max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">
                    🎉 ¡Nuevo Lead Capturado!
                  </h1>
                  <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                    Un cliente potencial está interesado en tus servicios
                  </p>
                </div>

                <!-- Content -->
                <div style="padding: 40px 30px;">
                  
                  <!-- Cliente Info -->
                  <div style="background: #0f172a; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #334155;">
                    <h2 style="margin: 0 0 20px 0; color: #8b5cf6; font-size: 18px; display: flex; align-items: center;">
                      👤 Información del Cliente
                    </h2>
                    
                    <div style="margin-bottom: 15px;">
                      <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Nombre</p>
                      <p style="margin: 5px 0 0 0; color: #f1f5f9; font-size: 16px; font-weight: 600;">${lead.nombre}</p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                      <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email</p>
                      <p style="margin: 5px 0 0 0; color: #f1f5f9; font-size: 16px;">
                        <a href="mailto:${lead.email}" style="color: #60a5fa; text-decoration: none;">${lead.email}</a>
                      </p>
                    </div>
                    
                    ${lead.telefono ? `
                    <div style="margin-bottom: 15px;">
                      <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Teléfono</p>
                      <p style="margin: 5px 0 0 0; color: #f1f5f9; font-size: 16px;">
                        <a href="tel:${lead.telefono}" style="color: #60a5fa; text-decoration: none;">${lead.telefono}</a>
                      </p>
                    </div>
                    ` : ''}
                    
                    <div>
                      <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Fecha</p>
                      <p style="margin: 5px 0 0 0; color: #f1f5f9; font-size: 14px;">${new Date(lead.fechaCreacion).toLocaleString('es-AR')}</p>
                    </div>
                  </div>

                  <!-- Proyecto Info -->
                  <div style="background: #0f172a; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #334155;">
                    <h2 style="margin: 0 0 15px 0; color: #8b5cf6; font-size: 18px;">
                      💼 Descripción del Proyecto
                    </h2>
                    <p style="margin: 0; color: #e5e7eb; font-size: 15px; line-height: 1.7;">
                      ${lead.proyecto}
                    </p>
                  </div>

                  ${conversacionHTML}

                  <!-- CTA -->
                  <div style="text-align: center; margin-top: 35px;">
                    <a href="mailto:${lead.email}?subject=Re: ${encodeURIComponent(lead.proyecto)}" 
                       style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); color: white; padding: 15px 35px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
                      📧 Responder al Cliente
                    </a>
                  </div>
                </div>

                <!-- Footer -->
                <div style="background: #0f172a; padding: 25px 30px; text-align: center; border-top: 1px solid #334155;">
                  <p style="margin: 0; color: #64748b; font-size: 13px;">
                    Este email fue generado automáticamente por tu Chatbot IA
                  </p>
                  <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;">
                    Lead ID: <span style="color: #8b5cf6; font-family: monospace;">${lead.id}</span>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      return { success: true };
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
}
