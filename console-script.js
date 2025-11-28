/**
 * TWITTER/X REPLIES DELETER - Script de Consola [VERSIÓN 4.1 - MEJORADO]
 * ========================================================================
 * 
 * INSTRUCCIONES:
 * 1. Abre Twitter/X y ve a tu perfil
 * 2. Click en la pestaña "Replies" (Respuestas)
 * 3. Abre la consola del navegador (F12)
 * 4. Pega este script completo y presiona Enter
 * 5. El script comenzará a eliminar SOLO TUS replies
 * 
 * MEJORAS v4.1:
 * - Espera activa hasta que el menú cargue completamente
 * - Sistema de reintentos cuando el menú está vacío
 * - Mejor manejo de tiempos de carga
 */

(async function deleteAllReplies() {
    console.log('🚀 Iniciando eliminador de replies de Twitter/X [V4.1 - MEJORADO]');
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
                console.log(`  → ✓ Delete encontrado`);
                return item;
            }
        }
        const allSpans = document.querySelectorAll('[role="menu"] span');
        for (let span of allSpans) {
            const text = span.textContent.trim();
            if (text === 'Delete' || text === 'Eliminar' || text === 'Borrar') {
                const menuitem = span.closest('[role="menuitem"]');
                if (menuitem) {
                    console.log(`  → ✓ Delete encontrado via span`);
                    return menuitem;
                }
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
            console.log('  → Confirmando...');
            confirmButton.click();
            return true;
        }
        return false;
    };

    // FUNCIÓN MEJORADA con espera activa
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

            // ESPERA ACTIVA: Esperar hasta que el menú tenga opciones
            let menuLoaded = false;
            let waitAttempts = 0;
            const maxWaitAttempts = 10; // 10 x 400ms = 4 segundos

            if (!menuLoaded) {
                console.log('  → ⏳ Menú no cargó, reintentando...');
                await closeOpenMenus();
                await randomDelay(1000, 1500);

                article.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await randomDelay(500, 700);
                moreButton.click();
                await randomDelay(3000, 3500);

                const menuItems = document.querySelectorAll('[role="menuitem"]');
                if (menuItems.length === 0) {
                    console.log('  → ❌ Menú vacío después de reintentar');
                    await closeOpenMenus();
                    return 'skip';
                }
                console.log(`  → ✓ Menú cargado en segundo intento(${menuItems.length} opciones)`);
            }

            const deleteButton = findDeleteButton();
            if (!deleteButton) {
                console.log('⚠️  No se encontró Delete');
                await closeOpenMenus();
                return 'skip';
            }

            console.log('  → Haciendo click en Delete...');
            deleteButton.click();
            await randomDelay(900, 1300);

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

    const processReplies = async () => {
        const username = getLoggedInUsername();
        if (!username) {
            console.error('❌ No se pudo detectar tu username.');
            return;
        }

        console.log(`✅ Usuario detectado: @${username} `);
        console.log('\n🔍 Buscando TUS replies para eliminar...\n');

        let consecutiveSkips = 0;
        let batchCount = 0;

        while (isRunning) {
            attemptCount++;
            await scrollToLoadMore();

            const replies = getUserReplies(username);
            const currentReplyCount = replies.length;

            console.log(`\n📊 Intento #${attemptCount} - TUS tweets: ${currentReplyCount} `);

            if (currentReplyCount === 0) {
                consecutiveSkips++;
                console.log(`⚠️  No se encontraron replies tuyos(${consecutiveSkips} / ${config.maxConsecutiveSkips})`);

                if (consecutiveSkips >= config.maxConsecutiveSkips) {
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('✅ No hay más replies tuyos para eliminar');
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
                console.log(`✅ Reply #${deletedCount} eliminado`);

                batchCount++;
                if (batchCount >= config.batchSize) {
                    console.log(`\n⏸️  Pausa breve...`);
                    await randomDelay(config.pauseAfterBatch, config.pauseAfterBatch + 1000);
                    batchCount = 0;
                }
            } else if (result === 'skip') {
                skippedCount++;
                console.log(`⏭️  Skipped(${skippedCount} total)`);
            } else {
                errorCount++;
                console.log(`❌ Error(${errorCount} total)`);
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
    console.log(`✅ Replies eliminados: ${deletedCount} `);
    console.log(`⏭️  Replies omitidos: ${skippedCount} `);
    console.log(`❌ Errores: ${errorCount} `);
    console.log(`🔄 Intent os totales: ${attemptCount} `);
    console.log(`⏱️  Tiempo total: ${minutes}m ${seconds} s`);
    if (deletedCount > 0) {
        const avgTime = Math.floor(duration / deletedCount);
        console.log(`⏱️  Promedio por reply: ${avgTime} s`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Recarga (F5) y ejecuta de nuevo si quedan más.');

})();
