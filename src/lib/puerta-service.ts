/**
 * Servicio de Control de Puerta Magnética
 * Controla un relé USB conectado al puerto serial para abrir/cerrar la puerta
 */

import { SerialPort } from 'serialport';

// Configuración del puerto serial desde variables de entorno
const PUERTO_ENABLED = process.env.PUERTA_ENABLED === 'true';
const PUERTO_PATH = process.env.PUERTA_PORT || '/dev/ttyUSB0';
const PUERTO_BAUDRATE = parseInt(process.env.PUERTA_BAUDRATE || '9600', 10);
const PUERTA_DURATION_MS = parseInt(process.env.PUERTA_DURATION_MS || '3000', 10);

// Comandos para el relé (ajustar según el modelo específico)
// Estos son comandos genéricos, pueden variar según el fabricante
const RELAY_ON = Buffer.from([0xA0, 0x01, 0x01, 0xA2]);  // Comando para activar relé
const RELAY_OFF = Buffer.from([0xA0, 0x01, 0x00, 0xA1]); // Comando para desactivar relé

/**
 * Abre la puerta magnética activando el relé USB
 */
export async function abrirPuertaMagnetica(): Promise<void> {
  // Si el control de puerta está deshabilitado, solo loguear
  if (!PUERTO_ENABLED) {
    console.log('[PUERTA] Control de puerta deshabilitado en configuración');
    return;
  }

  try {
    console.log(`[PUERTA] Intentando abrir puerta en puerto: ${PUERTO_PATH}`);

    // Crear conexión al puerto serial
    const port = new SerialPort({
      path: PUERTO_PATH,
      baudRate: PUERTO_BAUDRATE,
      autoOpen: false
    });

    // Promesa para manejar la apertura del puerto
    await new Promise<void>((resolve, reject) => {
      port.open((err) => {
        if (err) {
          reject(new Error(`Error al abrir puerto: ${err.message}`));
          return;
        }
        resolve();
      });
    });

    console.log('[PUERTA] Puerto serial abierto correctamente');

    // Enviar comando para activar el relé (abrir puerta)
    await new Promise<void>((resolve, reject) => {
      port.write(RELAY_ON, (err) => {
        if (err) {
          reject(new Error(`Error al enviar comando: ${err.message}`));
          return;
        }
        console.log('[PUERTA] Relé ACTIVADO - Puerta abierta');
        resolve();
      });
    });

    // Esperar el tiempo configurado antes de cerrar
    await new Promise(resolve => setTimeout(resolve, PUERTA_DURATION_MS));

    // Enviar comando para desactivar el relé (cerrar puerta)
    await new Promise<void>((resolve, reject) => {
      port.write(RELAY_OFF, (err) => {
        if (err) {
          reject(new Error(`Error al enviar comando de cierre: ${err.message}`));
          return;
        }
        console.log('[PUERTA] Relé DESACTIVADO - Puerta cerrada');
        resolve();
      });
    });

    // Cerrar el puerto serial
    await new Promise<void>((resolve) => {
      port.close(() => {
        console.log('[PUERTA] Puerto serial cerrado');
        resolve();
      });
    });

  } catch (error) {
    // Log del error pero no bloquear el check-in
    console.error('[PUERTA] Error al controlar puerta magnética:', error);
    // No lanzamos el error para que el check-in se complete aunque falle la puerta
  }
}

/**
 * Función alternativa para relés que solo requieren un pulso
 * (algunos relés se activan con cualquier dato)
 */
export async function abrirPuertaSimple(): Promise<void> {
  if (!PUERTO_ENABLED) {
    console.log('[PUERTA] Control de puerta deshabilitado');
    return;
  }

  try {
    const port = new SerialPort({
      path: PUERTO_PATH,
      baudRate: PUERTO_BAUDRATE,
    });

    port.on('open', () => {
      console.log('[PUERTA] Enviando pulso de apertura');
      port.write('1', (err) => {
        if (err) {
          console.error('[PUERTA] Error al enviar pulso:', err);
        }
        setTimeout(() => port.close(), PUERTA_DURATION_MS);
      });
    });

    port.on('error', (err) => {
      console.error('[PUERTA] Error en puerto serial:', err);
    });

  } catch (error) {
    console.error('[PUERTA] Error al controlar puerta:', error);
  }
}
