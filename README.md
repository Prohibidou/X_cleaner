# 🧹 X/Twitter Replies Cleaner

Herramienta para eliminar automáticamente todas tus respuestas (replies) de Twitter/X.

## 📋 Opciones Disponibles

### ✅ **Opción 1: Script de Consola (Recomendado)**

La forma más simple y directa. No requiere instalación.

#### 📝 Instrucciones:

1. **Abre Twitter/X en tu navegador** (Chrome, Edge, Firefox, etc.)
2. **Inicia sesión** en tu cuenta
3. **Ve a tu perfil** y haz click en la pestaña **"Replies"** (Respuestas)
4. Abre la **Consola del navegador**:
   - Windows/Linux: `F12` o `Ctrl + Shift + J`
   - Mac: `Cmd + Option + J`
5. **Copia todo el contenido** del archivo `console-script.js`
6. **Pégalo en la consola** y presiona `Enter`
7. El script comenzará a eliminar tus replies automáticamente

#### ⚙️ Características:
- ✅ No requiere instalación
- ✅ Funciona en cualquier navegador
- ✅ Usa tu sesión actual
- ✅ Delays aleatorios para evitar bloqueos
- ✅ Muestra progreso en tiempo real
- ✅ Pausas automáticas cada 10 eliminaciones
- ✅ Se puede detener recargando la página

---

### 🤖 **Opción 2: Script Automatizado con Puppeteer**

Versión automatizada que controla el navegador. Más compleja pero totalmente automática.

#### 📦 Instalación:

```bash
# Instalar dependencias
npm install
```

#### 🚀 Uso:

```bash
# Ejecutar el script
npm start
```

#### ⚙️ Nota Importante:
Este script intenta usar tu perfil de Chrome/Edge existente. Si tienes problemas, usa la **Opción 1** (script de consola) que es más simple.

---

## ⚠️ Advertencias Importantes

1. **Rate Limiting**: Twitter/X tiene límites de acciones por hora. El script incluye pausas aleatorias para minimizar el riesgo de bloqueo.

2. **Acción Irreversible**: Una vez eliminado un reply, **no se puede recuperar**.

3. **Uso Bajo Tu Responsabilidad**: Esta herramienta es para uso personal. Úsala responsablemente.

4. **Detener el Script**:
   - **Opción 1**: Recarga la página
   - **Opción 2**: `Ctrl + C` en la terminal

---

## 📊 Características

- 🔄 Eliminación automática uno por uno
- ⏱️ Delays aleatorios (2-5 segundos)
- 📦 Procesamiento por lotes (10 replies)
- ⏸️ Pausas automáticas cada lote (8 segundos)
- 📈 Estadísticas en tiempo real
- ✅ Contador de eliminaciones exitosas
- ❌ Contador de errores
- 🔄 Scroll automático para cargar más replies
- 🛡️ Protección contra rate limiting

---

## 🐛 Solución de Problemas

### El script no encuentra el botón "More" o "Delete"

Twitter/X cambia frecuentemente su interfaz. Si esto ocurre:

1. Abre la consola del navegador (`F12`)
2. Inspecciona manualmente un reply
3. Verifica los selectores CSS usados
4. Actualiza el script con los nuevos selectores

### El script se detiene

Posibles causas:
- No hay más replies visibles
- Twitter bloqueó temporalmente las acciones
- Cambios en la interfaz de Twitter

**Solución**: Espera unos minutos y vuelve a ejecutar el script.

### Puppeteer no funciona

Usa la **Opción 1** (script de consola) que es más confiable y simple.

---

## 📝 Registro de Cambios

### v1.0.0
- ✅ Script de consola implementado
- ✅ Script con Puppeteer implementado
- ✅ Delays aleatorios
- ✅ Pausas por lotes
- ✅ Estadísticas en tiempo real

---

## 📄 Licencia

MIT License - Uso personal bajo tu responsabilidad.

---

## 💡 Consejos

1. **Ejecuta el script en horas de baja actividad** para minimizar el riesgo de rate limiting
2. **Monitorea el proceso** para detectar cualquier problema
3. **Guarda los logs** si necesitas llevar un registro
4. **Ten paciencia**: Si tienes muchos replies, el proceso puede tomar tiempo

---

## 🎯 ¿Cuál opción elegir?

### Usa **Opción 1** (Script de Consola) si:
- ✅ Quieres algo simple y rápido
- ✅ No quieres instalar nada
- ✅ Tienes problemas con Puppeteer

### Usa **Opción 2** (Puppeteer) si:
- ✅ Quieres automatización completa
- ✅ Estás cómodo con Node.js
- ✅ Necesitas más control sobre el proceso

---

**⭐ Recomendación**: Empieza con la **Opción 1** (Script de Consola). Es más simple y funciona en todos los casos.
