# Changelog - X_cleaner

Todos los cambios notables del proyecto serán documentados en este archivo.

## [v4.2 STABLE] - 2025-11-27

### 🎯 Objetivo Principal
Solucionar el problema de "Menú tiene 0 opciones" que causaba que el script no pudiera encontrar el botón Delete en muchos intentos.

### ✅ Cambios Implementados

#### 1. **Sistema de Espera Activa Corregido**
- **Problema anterior:** El código esperaba un tiempo fijo (2.5s) después de abrir el menú, pero a veces el menú tardaba más en cargar
- **Solución:** Implementado un `while` loop que verifica activamente cada 500ms si el menú tiene opciones cargadas
- **Resultado:** El script ahora espera dinámicamente hasta que el menú esté listo (máximo 5 segundos)

```javascript
while (!menuLoaded && waitAttempts < maxWaitAttempts) {
    await randomDelay(500, 600);
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    if (menuItems.length > 0) {
        menuLoaded = true;
    } else {
        waitAttempts++;
    }
}
```

#### 2. **Sistema de Reintentos Inteligente**
- **Implementación:** Si el menú no carga después de 10 intentos (5 segundos), el script:
  1. Cierra el menú con ESC
  2. Espera 1.5-2 segundos
  3. Hace scroll al tweet
  4. Vuelve a abrir el menú
  5. Espera 3-3.5 segundos
- **Resultado:** Segunda oportunidad para tweets con menús lentos de cargar

#### 3. **Logging Mejorado**
- Feedback paso a paso del proceso:
  - `→ Abriendo menú...`
  - `→ ✓ Menú cargado (X opciones)`
  - `→ ✓ Delete encontrado`
  - `→ ✓ Confirmado`
- Mensajes más compactos y claros
- Mejor visualización del progreso

#### 4. **Reducción de Falsos Positivos**
- El script ahora distingue claramente entre:
  - **Omitido (skip):** No es tu reply o no tiene Delete
  - **Error:** Fallo técnico en el proceso
  - **Éxito:** Reply eliminado correctamente

### 📊 Resultados Esperados

**ANTES (v4.1):**
```
→ ❌ Delete no encontrado. Menú tiene 0 opciones: (frecuente)
⏭️  Skipped: ~70% de los intentos
✅ Eliminados: ~30% de los replies
```

**DESPUÉS (v4.2):**
```
→ ✓ Menú cargado (X opciones) (mayoría de intentos)
⏭️  Skipped: Solo replies que NO son tuyos
✅ Eliminados: ~90%+ de TUS replies
```

### 🔧 Detalles Técnicos

#### Timing Optimizado:
- Espera activa: 500-600ms por intento (10 intentos max = 5s)
- Reintento adicional: 3-3.5s de espera garantizada
- Confirmación: 600-900ms antes de buscar botón
- Post-eliminación: 1500-2000ms antes del siguiente

#### Selectores Robustos:
- `[role="menuitem"]` para opciones del menú
- Búsqueda por texto: "Delete", "Eliminar", "Borrar"
- Fallback: búsqueda en `<span>` dentro del menú
- `data-testid="confirmationSheetConfirm"` para confirmación

#### Filtro de Usuario:
- Detección automática del username logueado
- Verificación de autoría por links en el artículo
- Solo procesa tweets que coincidan con el username

### 🐛 Bugs Corregidos

1. **Bug #1:** Menú vacío (0 opciones) - **CORREGIDO**
   - Causa: Espera fija insuficiente
   - Fix: Espera activa con while loop

2. **Bug #2:** Procesaba tweets de otros usuarios - **CORREGIDO**
   - Causa: No verificaba autoría antes de intentar eliminar
   - Fix: Filtro `isTweetByUser()` antes de procesar

3. **Bug #3:** No reintentaba cuando fallaba - **CORREGIDO**
   - Causa: Un solo intento por tweet
   - Fix: Sistema de segundo intento automático

### 📝 Notas de Uso

- **Detención manual:** Recarga la página (F5) o `stopDeletingReplies()`
- **Rate limiting:** El script usa delays aleatorios para evitar bloqueos
- **Batch processing:** Pausa cada 3 replies eliminados (3 segundos)
- **Skips consecutivos:** Se detiene después de 20 intentos sin encontrar tus replies

### ⚠️ Advertencias

- La eliminación es **PERMANENTE e IRREVERSIBLE**
- Mantén la pestaña **VISIBLE** durante la ejecución
- Twitter/X puede cambiar su interfaz, requiriendo actualizaciones
- El script solo funciona en la pestaña "Replies" de tu perfil

---

## [v4.1 WIP] - 2025-11-27

### Cambios
- Primer intento de espera activa (con bug en la lógica)
- Aumento de `menuWaitTime` a 2500ms
- Debug logging agregado

### Problemas
- ❌ El `while` loop no se ejecutaba correctamente
- ❌ Seguía habiendo menús vacíos

---

## [v1.0] - 2025-11-27

### Funcionalidades Iniciales
- ✅ Detección automática del username
- ✅ Filtro para procesar solo tweets del usuario
- ✅ Eliminación automatizada con delays aleatorios
- ✅ Sistema de scroll para cargar más tweets
- ✅ Manejo básico de errores
- ✅ Script alternativo con Puppeteer
- ✅ README con instrucciones completas

### Arquitectura
- Script de consola para navegador
- Script automatizado con Puppeteer
- Configuración en `package.json`
- `.gitignore` para desarrollo limpio

---

## Roadmap Futuro

### Posibles Mejoras v4.3:
- [ ] Soporte para múltiples idiomas en la UI
- [ ] Exportar lista de replies antes de eliminar
- [ ] Filtro por fecha (eliminar solo replies antiguos)
- [ ] Modo "dry-run" (simular sin eliminar)
- [ ] Contador en tiempo real en la página
- [ ] Detección automática de rate limits

### Posibles Mejoras v5.0:
- [ ] Extensión de navegador
- [ ] UI gráfica integrada
- [ ] Backup automático de replies
- [ ] Filtro por palabra clave
- [ ] Estadísticas detalladas
