/**
 * TWITTER/X REPLIES DELETER - Script de Consola [VERSIÓN 4 - FILTRO POR USUARIO]
 * =============================================================================
 * 
 * INSTRUCCIONES:
 * 1. Abre Twitter/X y ve a tu perfil
 * 2. Click en la pestaña "Replies" (Respuestas)
 * 3. Abre la consola del navegador (F12)
 * 4. Pega este script completo y presiona Enter
 * 5. El script comenzará a eliminar SOLO TUS replies
 * 
 * IMPORTANTE:
 * - Solo procesa tweets que sean TUYOS (verifica el autor)
 * - Ignora tweets originales de otras personas
 * - Puedes detenerlo recargando la página (F5)
 */

(async function deleteAllReplies() {
    console.log('🚀 Iniciando eliminador de replies de Twitter/X [V4 - CON FILTRO DE USUARIO]');
    console.log('⚠️  Para detener en cualquier momento, recarga la página (F5)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let deletedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let attemptCount = 0;
    const startTime = Date.now();
    let isRunning = true;

    // Configuración optimizada
    const config = {
        minDelay: 1000,
        maxDelay: 2000,
        scrollDelay: 800,
        maxConsecutiveSkips: 20,
        batchSize: 3,
        pauseAfterBatch: 3000,
        waitAfterDelete: 1500,
        menuWaitTime: 2500  // Aumentado para dar más tiempo al menú
    };

    // Función para esperar
    const randomDelay = (min = config.minDelay, max = config.maxDelay) => {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    };

    // Función para hacer scroll
    const scrollToLoadMore = async () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        await randomDelay(config.scrollDelay, config.scrollDelay + 300);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await randomDelay(400, 600);
    };

    // Cerrar menús
    const closeOpenMenus = async () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27 }));
        await randomDelay(200, 400);
    };

    // Obtener username del usuario logueado
    const getLoggedInUsername = () => {
        const profileLink = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]');
        if (profileLink) {
            const href = profileLink.getAttribute('href');
            if (href) {
                const match = href.match(/^\/([^\/]+)$/);
                if (match) return match[1].toLowerCase();
            }
        }
        return null;
    };

    // Verificar si un tweet es del usuario
    const isTweetByUser = (article, username) => {
        if (!username) return false;

        const authorLinks = article.querySelectorAll('a[role="link"]');

        for (let link of authorLinks) {
            const href = link.getAttribute('href');
            if (href && href.startsWith('/')) {
                if (href.includes('/status/')) continue;

                const match = href.match(/^\/([^\/]+)$/);
                if (match) {
                    const tweetUsername = match[1].toLowerCase();
                    if (tweetUsername === username) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    // Obtener SOLO los replies del usuario
    const getUserReplies = (username) => {
        const articles = document.querySelectorAll('article[data-testid="tweet"]');
        const userArticles = [];

        for (let article of articles) {
            if (isTweetByUser(article, username)) {
                userArticles.push(article);
            }
        }

        return userArticles;
    };

    // Encontrar botón More
    const findMoreButton = (article) => {
        const buttons = article.querySelectorAll('button[aria-label]');
        for (let btn of buttons) {
            const label = btn.getAttribute('aria-label');
            if (label && label.toLowerCase().includes('more')) {
                return btn;
            }
        }

        const caretButton = article.querySelector('[data-testid="caret"]');
        if (caretButton) return caretButton;

        const actionButtons = article.querySelectorAll('[role="group"] button');
        if (actionButtons.length > 0) {
            return actionButtons[actionButtons.length - 1];
        }

        return null;
    };

    // Encontrar botón Delete
    const findDeleteButton = () => {
        const menuItems = document.querySelectorAll('[role="menuitem"]');

        for (let item of menuItems) {
            const allText = item.textContent || item.innerText || '';

            if (allText.match(/^Delete$/i) ||
                allText.match(/^Eliminar$/i) ||
                allText.match(/^Borrar$/i) ||
                allText.includes('Delete post') ||
                allText.includes('Eliminar post')) {

                console.log(`  → ✓ Delete encontrado: "${allText.substring(0, 20)}"`);
                return item;
            }
        }

        const allSpans = document.querySelectorAll('[role="menu"] span');
        for (let span of allSpans) {
            const text = span.textContent.trim();
            if (text === 'Delete' || text === 'Eliminar' || text === 'Borrar') {
                const menuitem = span.closest('[role="menuitem"]');
                if (menuitem) {
                    console.log(`  → ✓ Delete encontrado via span: "${text}"`);
                    return menuitem;
                }
            }
        }

        // DEBUG: Mostrar todas las opciones disponibles
        console.log(`  → ❌ Delete no encontrado. Menú tiene ${menuItems.length} opciones:`);
        menuItems.forEach((item, index) => {
            const text = (item.textContent || '').trim().substring(0, 40);
            console.log(`     [${index}] "${text}"`);
        });

        return null;
    };

    // Confirmar eliminación
    const confirmDelete = async () => {
        await randomDelay(500, 800);

        let confirmButton = document.querySelector('[data-testid="confirmationSheetConfirm"]');

        if (!confirmButton) {
            const dialogButtons = document.querySelectorAll('[role="button"]');
            for (let btn of dialogButtons) {
                const text = (btn.textContent || '').trim();
                if (text === 'Delete' || text === 'Eliminar' || text === 'Borrar') {
                    confirmButton = btn;
                    break;
                }
            }
        }

        if (confirmButton) {
            console.log('  → Confirmando...');
            confirmButton.click();
            return true;
        }

        console.log('  → ❌ No se encontró botón de confirmación');
        return false;
    };

    // Eliminar un tweet
    const deleteTweet = async (article) => {
        try {
            await closeOpenMenus();

            article.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await randomDelay(400, 600);

            const moreButton = findMoreButton(article);
            if (!moreButton) {
                console.log('⚠️  No se encontró el botón More');
                return 'skip';
            }

            console.log('  → Abriendo menú...');
            moreButton.click();
            await randomDelay(config.menuWaitTime, config.menuWaitTime + 500);

            const deleteButton = findDeleteButton();
            if (!deleteButton) {
                console.log('⚠️  No se encontró Delete');
                await closeOpenMenus();
                return 'skip';
            }

            console.log('  → Haciendo click en Delete...');
            deleteButton.click();
            await randomDelay(800, 1200);

            const confirmed = await confirmDelete();
            if (!confirmed) {
                console.log('⚠️  No se pudo confirmar');
                await closeOpenMenus();
                return 'error';
            }

            await randomDelay(config.waitAfterDelete, config.waitAfterDelete + 500);
            return 'success';

        } catch (error) {
            console.error('❌ Error:', error.message);
            await closeOpenMenus();
            return 'error';
        }
    };

    // Proceso principal
    const processReplies = async () => {
        // Obtener username del usuario logueado
        const username = getLoggedInUsername();
        if (!username) {
            console.error('❌ No se pudo detectar tu username. Asegúrate de estar logueado.');
            return;
        }

        console.log(`✅ Usuario detectado: @${username}`);
        console.log('\n🔍 Buscando TUS replies para eliminar...\n');

        let consecutiveSkips = 0;
        let batchCount = 0;

        while (isRunning) {
            attemptCount++;

            await scrollToLoadMore();

            const replies = getUserReplies(username);
            const currentReplyCount = replies.length;

            console.log(`\n📊 Intento #${attemptCount} - TUS tweets encontrados: ${currentReplyCount}`);

            if (currentReplyCount === 0) {
                consecutiveSkips++;
                console.log(`⚠️  No se encontraron replies tuyos (${consecutiveSkips}/${config.maxConsecutiveSkips})`);

                if (consecutiveSkips >= config.maxConsecutiveSkips) {
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('✅ No hay más replies tuyos para eliminar');
                    break;
                }

                await randomDelay(2000, 3000);
                continue;
            }

            consecutiveSkips = 0;

            console.log(`🗑️  Procesando tu reply...`);
            const result = await deleteTweet(replies[0]);

            if (result === 'success') {
                deletedCount++;
                console.log(`✅ Reply #${deletedCount} eliminado`);

                batchCount++;
                if (batchCount >= config.batchSize) {
                    console.log(`\n⏸️  Pausa breve...`);
                    await randomDelay(config.pauseAfterBatch, config.pauseAfterBatch + 1000);
                    batchCount = 0;
                }

            } else if (result === 'skip') {
                skippedCount++;
                console.log(`⏭️  Skipped (${skippedCount} total)`);

            } else {
                errorCount++;
                console.log(`❌ Error (${errorCount} total)`);
            }

            await randomDelay();
        }
    };

    // Manejador para detener
    window.stopDeletingReplies = () => {
        isRunning = false;
        console.log('\n🛑 Deteniendo...');
    };

    // Ejecutar
    try {
        await processReplies();
    } catch (error) {
        console.error('❌ Error fatal:', error);
    }

    // Resumen
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Replies eliminados: ${deletedCount}`);
    console.log(`⏭️  Replies omitidos: ${skippedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`🔄 Intentos totales: ${attemptCount}`);
    console.log(`⏱️  Tiempo total: ${minutes}m ${seconds}s`);
    if (deletedCount > 0) {
        const avgTime = Math.floor(duration / deletedCount);
        console.log(`⏱️  Promedio por reply: ${avgTime}s`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Recarga la página (F5) y ejecuta de nuevo si quedan más.');

})();
