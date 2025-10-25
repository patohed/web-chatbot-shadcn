// Infrastructure Layer - Captcha
import { CaptchaVerification } from '@/types/domain';
import { config } from '../config';

export class CaptchaService {
  async verify(token: string): Promise<CaptchaVerification> {
    // En desarrollo sin secret key, permitir
    if (!config.captcha.enabled) {
      console.warn('⚠️  CAPTCHA verificación omitida (no configurado)');
      return { success: true };
    }

    // Validar token básico
    if (!token || token === 'skip') {
      return {
        success: false,
        error: 'Token de CAPTCHA requerido',
      };
    }

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${config.captcha.secretKey}&response=${token}`,
      });

      const data = await response.json();
      
      return {
        success: data.success,
        error: data.success ? undefined : 'Verificación de CAPTCHA fallida',
      };
    } catch (error) {
      console.error('[CaptchaService] Error:', error);
      return {
        success: false,
        error: 'Error al verificar CAPTCHA',
      };
    }
  }
}
