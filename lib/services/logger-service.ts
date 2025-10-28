/**
 * 📝 Logger Service
 * Clean Architecture - Infrastructure Layer
 * 
 * Centraliza logging con niveles configurables
 * En producción solo muestra errores, en desarrollo muestra todo
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

class LoggerService {
  private level: LogLevel;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // En producción solo errores, en desarrollo todo
    this.level = this.isProduction ? LogLevel.ERROR : LogLevel.DEBUG;
  }

  /**
   * Configura el nivel de log manualmente
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(context: string, message: string, data?: unknown): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`🔍 [${context}] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Log de información
   */
  info(context: string, message: string, data?: unknown): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`ℹ️  [${context}] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Log de advertencia
   */
  warn(context: string, message: string, data?: unknown): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`⚠️ [${context}] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Log de error (siempre se muestra)
   */
  error(context: string, message: string, error?: unknown): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`❌ [${context}] ${message}`, error || '');
      
      // En producción, aquí podrías enviar a Sentry, LogRocket, etc.
      if (this.isProduction && error) {
        // TODO: Integrar servicio de error tracking
        // sentry.captureException(error);
      }
    }
  }

  /**
   * Log de éxito (información positiva)
   */
  success(context: string, message: string, data?: unknown): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`✅ [${context}] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Separador visual para grupos de logs
   */
  separator(char: string = '='): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(char.repeat(60));
    }
  }

  /**
   * Grupo de logs (mejora legibilidad)
   */
  group(title: string, fn: () => void): void {
    if (this.level <= LogLevel.DEBUG) {
      console.group(`📦 ${title}`);
      fn();
      console.groupEnd();
    }
  }
}

// Singleton instance
export const logger = new LoggerService();

// Export para testing
export { LoggerService };
