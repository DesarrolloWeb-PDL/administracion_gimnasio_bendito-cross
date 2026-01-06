# Control de Puerta Magnética - Implementación

## Estado Actual
El sistema de check-in actualmente:
- ✅ Registra asistencias en la base de datos
- ✅ Valida el estado de suscripción del socio
- ✅ Muestra mensajes de éxito/advertencia/error
- ❌ **NO controla la puerta magnética USB**

## Ubicación del Código
- **Formulario Frontend:** `/src/components/asistencias/check-in-form.tsx`
- **Lógica Backend:** `/src/lib/actions-asistencias.ts`

## Opciones de Implementación

### Opción A: Control mediante Puerto Serial/USB (serialport)
**Mejor para:** Relés USB genéricos, cerraduras con controlador serial

#### Requisitos:
```bash
npm install serialport
```

#### Ventajas:
- Control directo del hardware
- Compatible con la mayoría de relés USB
- No requiere software adicional

#### Desventajas:
- Requiere configurar el puerto serial correcto
- Puede requerir permisos especiales en Linux
- Dependencia nativa (puede complicar el deployment)

#### Implementación:
1. Crear un API Route en `/src/app/api/puerta/route.ts`
2. Usar serialport para enviar señal al dispositivo
3. Llamar al endpoint desde `actions-asistencias.ts` cuando el acceso sea permitido

---

### Opción B: Control mediante Comando del Sistema
**Mejor para:** Dispositivos con software/script propio instalado

#### Implementación:
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function abrirPuerta() {
  try {
    await execPromise('ruta/al/script/abrir-puerta.sh');
    console.log('Puerta abierta');
  } catch (error) {
    console.error('Error al abrir puerta:', error);
  }
}
```

#### Ventajas:
- Simple si ya existe el script/programa
- Desacoplado del código de Next.js
- Fácil de mantener

#### Desventajas:
- Requiere que el script exista previamente
- Depende del sistema operativo

---

### Opción C: Integración con API REST del Dispositivo
**Mejor para:** Controladores modernos con API web (ej: ESP32, Arduino con WiFi)

#### Implementación:
```typescript
async function abrirPuerta() {
  try {
    const response = await fetch('http://192.168.1.X/abrir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'abrir', duracion: 3 })
    });
    
    if (response.ok) {
      console.log('Puerta abierta via API');
    }
  } catch (error) {
    console.error('Error al contactar controlador:', error);
  }
}
```

#### Ventajas:
- Sin dependencias nativas
- Control remoto posible
- Más flexible y escalable

#### Desventajas:
- Requiere hardware con capacidad de red
- Seguridad de red a considerar

---

## Modificaciones Necesarias en el Código

### 1. En `actions-asistencias.ts`
Agregar llamada al control de puerta después de registrar asistencia:

```typescript
// Después de crear la asistencia
if (estadoSuscripcion === 'ACTIVA' || estadoSuscripcion === 'PERSUADIDO') {
  await prisma.asistencia.create({
    data: {
      socioId: socio.id,
      fecha: new Date(),
    },
  });

  // NUEVO: Abrir puerta magnética
  await abrirPuertaMagnetica();

  revalidatePath('/admin');
  // ...resto del código
}
```

### 2. Crear servicio de control de puerta
Archivo: `/src/lib/puerta-service.ts`

```typescript
export async function abrirPuertaMagnetica(): Promise<void> {
  try {
    // Implementación según la opción elegida
    console.log('Abriendo puerta magnética...');
    
    // Aquí va la lógica específica del dispositivo
    
    console.log('Puerta abierta correctamente');
  } catch (error) {
    console.error('Error al abrir puerta:', error);
    // No lanzar error para no bloquear el check-in
  }
}
```

---

## Información Técnica Requerida

Para implementar la solución correcta, necesitamos saber:

1. **Marca y modelo del dispositivo de control de puerta**
2. **Tipo de conexión:** USB, Serial, Red Ethernet/WiFi
3. **Sistema operativo del servidor:** Linux, Windows
4. **Documentación del dispositivo:** Manual técnico, protocolo de comunicación
5. **Software existente:** ¿Ya tienen algún programa instalado para controlar la puerta?

---

## Consideraciones de Seguridad

- ✅ Solo permitir apertura desde el servidor (no desde el cliente)
- ✅ Log de todas las aperturas de puerta
- ✅ Timeout de seguridad (puerta se cierra automáticamente)
- ✅ Manejo de errores sin bloquear el check-in
- ✅ Validación adicional antes de abrir

---

## Configuración Recomendada

Agregar al archivo `.env`:
```bash
# Configuración Puerta Magnética
PUERTA_ENABLED=true
PUERTA_TYPE=serial|command|api
PUERTA_PORT=/dev/ttyUSB0
PUERTA_BAUDRATE=9600
PUERTA_API_URL=http://192.168.1.X
PUERTA_DURATION_MS=3000
```

---

## Próximos Pasos

1. ✅ Identificar el hardware específico
2. ⏳ Elegir la opción de implementación adecuada
3. ⏳ Instalar dependencias necesarias
4. ⏳ Implementar el servicio de control de puerta
5. ⏳ Integrar con el flujo de check-in
6. ⏳ Probar en ambiente local
7. ⏳ Desplegar a producción

---

**Fecha de creación:** 6 de enero de 2026
**Estado:** Pendiente de implementación
