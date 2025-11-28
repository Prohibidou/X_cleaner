/**
 * TWITTER/X REPLIES DELETER - Script de Consola [v4.2 STABLE]
 * ============================================================
 * 
 * INSTRUCCIONES:
 * 1. Abre Twitter/X y ve a tu perfil
 * 2. Click en la pestaña "Replies" (Respuestas)
 * 3. Abre la consola del navegador (F12)
 * 4. Pega este script completo y presiona Enter
 * 5. El script comenzará a eliminar SOLO TUS replies
 * 
 * MEJORAS v4.2:
 * - ✅ Espera activa hasta que el menú cargue completamente
 * - ✅ Sistema de reintentos cuando el menú está vacío
 * - ✅ Filtro por usuario (solo elimina TUS replies)
 * - ✅ Manejo robusto de errores y timing
 */

(async function deleteAllReplies() {
    console.log('🚀 Iniciando X Cleaner [v4.2 STABLE]');
    console.log('⚠️  Para detener: recarga la página (F5)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let deletedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let attemptCount = 0;
    const startTime = Date.now();
    let isRunning = true;

    const config = {
        minDelay: 1000,
        maxDelay: 2000,
        scrollDelay: 800,
        maxConsecutiveSkips: 20,
        batchSize: 3,
        pauseAfterBatch: 3000,
        waitAfterDelete: 1500
    };

    const randomDelay = (min = config.minDelay, max = config.maxDelay) => {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    };

    const scrollToLoadMore = async () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        await randomDelay(config.scrollDelay, config.scrollDelay + 300);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await randomDelay(400, 600);
    };

    const closeOpenMenus = async () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27 }));
        await randomDelay(200, 400);
    };

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

    const findDeleteButton = () => {
        const menuItems = document.querySelectorAll('[role="menuitem"]');
        for (let item of menuItems) {
            const allText = item.textContent || item.innerText || '';
            if (allText.match(/^Delete$/i) ||
                allText.match(/^Eliminar$/i) ||
                allText.match(/^Borrar$/i) ||
                allText.includes('Delete post') ||
                allText.includes('Eliminar post')) {
                return item;
            }
        }
        const allSpans = document.querySelectorAll('[role="menu"] span');
        for (let span of allSpans) {
            const text = span.textContent.trim();
            if (text === 'Delete' || text === 'Eliminar' || text === 'Borrar') {
                const menuitem = span.closest('[role="menuitem"]');
                if (menuitem) return menuitem;
            }
        }
        return null;
    };

    const confirmDelete = async () => {
        await randomDelay(600, 900);
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
            confirmButton.click();
            return true;
        }
        return false;
    };

    // FUNCIÓN MEJORADA CON ESPERA ACTIVA CORRECTA
    const deleteTweet = async (article) => {
        try {
            await closeOpenMenus();
            article.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await randomDelay(400, 600);

            const moreButton = findMoreButton(article);
            if (!moreButton) {
                console.log('  ⚠️  Botón More no encontrado');
                return 'skip';
            }

            console.log('  → Abriendo menú...');
            moreButton.click();

            // ESPERA ACTIVA: Esperar hasta que el menú tenga opciones
            let menuLoaded = false;
            let waitAttempts = 0;
            const maxWaitAttempts = 10; // 10 x 500ms = 5 segundos

            while (!menuLoaded && waitAttempts < maxWaitAttempts) {
                await randomDelay(500, 600);
                const menuItems = document.querySelectorAll('[role="menuitem"]');

                if (menuItems.length > 0) {
                    menuLoaded = true;
                    console.log(`  → ✓ Menú cargado (${menuItems.length} opciones)`);
                } else {
                    waitAttempts++;
                }
            }

            // Si el menú no cargó, REINTENTAR UNA VEZ
            if (!menuLoaded) {
                console.log('  → ⏳ Menú vacío, reintentando...');
                await closeOpenMenus();
                await randomDelay(1500, 2000);

                article.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await randomDelay(600, 800);
                moreButton.click();
                await randomDelay(3000, 3500);

                const menuItems = document.querySelectorAll('[role="menuitem"]');
                if (menuItems.length === 0) {
                    console.log('  → ❌ Menú sigue vacío');
                    await closeOpenMenus();
                    return 'skip';
                }
                console.log(`  → ✓ Menú cargado en 2° intento (${menuItems.length} opciones)`);
            }

            const deleteButton = findDeleteButton();
            if (!deleteButton) {
                console.log('  ⚠️  Delete no encontrado (no es tu reply)');
                await closeOpenMenus();
                return 'skip';
            }

            console.log('  → ✓ Delete encontrado');
            deleteButton.click();
            await randomDelay(900, 1300);

            const confirmed = await confirmDelete();
            if (!confirmed) {
                console.log('  ⚠️  No se pudo confirmar');
                await closeOpenMenus();
                return 'error';
            }

            console.log('  → ✓ Confirmado');
            await randomDelay(config.waitAfterDelete, config.waitAfterDelete + 500);
            return 'success';

        } catch (error) {
            console.error('  ❌ Error:', error.message);
            await closeOpenMenus();
            return 'error';
        }
    };

    const processReplies = async () => {
        const username = getLoggedInUsername();
        if (!username) {
            console.error('❌ No se pudo detectar tu username');
            return;
        }

        console.log(`✅ Usuario: @${username}`);
        console.log('\n🔍 Buscando tus replies...\n');

        let consecutiveSkips = 0;
        let batchCount = 0;

        while (isRunning) {
            attemptCount++;
            await scrollToLoadMore();

            const replies = getUserReplies(username);
            const currentReplyCount = replies.length;

            console.log(`\n📊 Intento #${attemptCount} - Tus tweets: ${currentReplyCount}`);

            if (currentReplyCount === 0) {
                consecutiveSkips++;
                console.log(`⚠️  Sin replies tuyos (${consecutiveSkips}/${config.maxConsecutiveSkips})`);

                if (consecutiveSkips >= config.maxConsecutiveSkips) {
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('✅ No hay más replies tuyos');
                    break;
                }

                await randomDelay(2000, 3000);
                continue;
            }

            consecutiveSkips = 0;
            console.log(`🗑️  Procesando reply...`);
            const result = await deleteTweet(replies[0]);

            if (result === 'success') {
                deletedCount++;
                console.log(`✅ Reply #${deletedCount} eliminado\n`);

                batchCount++;
                if (batchCount >= config.batchSize) {
                    console.log(`⏸️  Pausa (${config.pauseAfterBatch}ms)...\n`);
                    await randomDelay(config.pauseAfterBatch, config.pauseAfterBatch + 1000);
                    batchCount = 0;
                }
            } else if (result === 'skip') {
                skippedCount++;
                console.log(`⏭️  Omitido (${skippedCount} total)\n`);
            } else {
                errorCount++;
                console.log(`❌ Error (${errorCount} total)\n`);
            }

            await randomDelay();
        }
    };

    window.stopDeletingReplies = () => {
        isRunning = false;
        console.log('\n🛑 Deteniendo...');
    };

    try {
        await processReplies();
    } catch (error) {
        console.error('❌ Error fatal:', error);
    }

    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN FINAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Eliminados: ${deletedCount}`);
    console.log(`⏭️  Omitidos: ${skippedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`🔄 Intentos: ${attemptCount}`);
    console.log(`⏱️  Tiempo: ${minutes}m ${seconds}s`);
    if (deletedCount > 0) {
        const avgTime = Math.floor(duration / deletedCount);
        console.log(`⏱️  Promedio: ${avgTime}s/reply`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Recarga (F5) si quedan más replies');

})();
