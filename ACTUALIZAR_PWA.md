# Cómo Actualizar el Ícono y Nombre de la PWA en el Celular

## El problema
Los navegadores cachean agresivamente el `manifest.json` y los iconos de las PWA (Progressive Web Apps). Esto significa que aunque actualices el logo o nombre en la configuración, el ícono en el celular no cambia automáticamente.

## Solución: Forzar la actualización

### Opción 1: Desinstalar y Reinstalar (Más Efectiva)

1. **En el celular, desinstala la app actual:**
   - Mantén presionado el ícono de la app
   - Selecciona "Desinstalar" o "Eliminar"

2. **Limpia la caché del navegador:**
   - Abre Chrome en el celular
   - Ve a Configuración → Privacidad y seguridad → Borrar datos de navegación
   - Selecciona "Imágenes y archivos en caché"
   - Toca "Borrar datos"

3. **Cierra Chrome completamente:**
   - Ve a Aplicaciones recientes y cierra Chrome
   - O reinicia el celular para estar seguro

4. **Vuelve a instalar la PWA:**
   - Abre Chrome y visita el sitio
   - Toca el menú (⋮) → "Instalar aplicación" o "Agregar a pantalla de inicio"
   - Ahora debería mostrar el nuevo logo y nombre

### Opción 2: Actualización Manual (Si no funciona la Opción 1)

1. **Borra los datos del sitio específico:**
   - Chrome → Configuración → Sitios web → Ver permisos y datos
   - Busca tu dominio
   - Toca "Borrar y restablecer"

2. **Accede al sitio en modo incógnito:**
   - Chrome → Nueva pestaña de incógnito
   - Visita el sitio
   - Instala la PWA desde ahí

### Opción 3: Para Desarrolladores (Más técnica)

1. **En Chrome Desktop (conectado al celular):**
   - Abre Chrome DevTools (F12)
   - Ve a Application → Storage → Clear site data
   - Marca todas las opciones
   - Toca "Clear site data"

2. **Actualiza el Service Worker:**
   - Application → Service Workers
   - Marca "Update on reload"
   - Recarga la página

## Verificar que funciona

Después de reinstalar, deberías ver:
- ✅ El nuevo logo del gimnasio como ícono
- ✅ El nombre correcto del gimnasio (ej: "ABM Bendito Cross")
- ✅ Los colores configurados

## Notas importantes

- **Los cambios en la app (código, páginas) se actualizan automáticamente** ✅
- **El ícono y nombre solo cambian al reinstalar** ⚠️
- Esto es un comportamiento normal de las PWA, no es un bug
- Una vez reinstalada, los usuarios verán el ícono correcto

## Cambios técnicos implementados

- ✅ Manifest dinámico basado en configuración
- ✅ API de iconos dinámicos (`/api/icon`)
- ✅ Headers de no-cache en iconos
- ✅ Timestamp en URLs para forzar recarga
- ✅ `dynamic = 'force-dynamic'` en manifest

## Para usuarios finales

Cuando hagas cambios al logo o nombre del gimnasio:

1. Avisa a los usuarios que deben **desinstalar y reinstalar la app**
2. Proporciona instrucciones simples (Opción 1 arriba)
3. Asegúrales que **no perderán datos** (todo está en la nube)

---

**Desarrollado para:** Sistema de Gestión de Gimnasio White-Label
**Fecha:** Enero 2026
