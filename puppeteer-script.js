const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');

/**
 * TWITTER/X REPLIES DELETER - Script Automatizado con Puppeteer
 * =============================================================
 * 
 * Este script usa tu sesión de Chrome/Edge existente para eliminar replies
 */

class TwitterRepliesDeleter {
    constructor() {
        this.deletedCount = 0;
        this.errorCount = 0;
        this.startTime = Date.now();

        // Configuración
        this.config = {
            minDelay: 2000,
            maxDelay: 5000,
            scrollDelay: 1500,
            maxRetries: 3,
            batchSize: 10,
            pauseAfterBatch: 8000,
            headless: false, // Mostrar el navegador

            // Rutas de perfiles de navegador (ajusta según tu configuración)
            chromeProfilePath: path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data'),
            edgeProfilePath: path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data'),
        };
    }

    // Espera aleatoria
    async randomDelay(min = this.config.minDelay, max = this.config.maxDelay) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Iniciar el navegador
    async initBrowser() {
        console.log('🚀 Iniciando navegador...');

        try {
            // Intentar con el perfil de Chrome
            this.browser = await puppeteer.launch({
                headless: this.config.headless,
                userDataDir: this.config.chromeProfilePath,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                ]
            });

            console.log('✅ Navegador iniciado con perfil de Chrome');
        } catch (error) {
            console.log('⚠️  No se pudo usar Chrome, intentando con Edge...');

            try {
                this.browser = await puppeteer.launch({
                    headless: this.config.headless,
                    userDataDir: this.config.edgeProfilePath,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-blink-features=AutomationControlled',
                    ]
                });

                console.log('✅ Navegador iniciado con perfil de Edge');
            } catch (error2) {
                console.error('❌ Error al iniciar navegador:', error2.message);
                console.log('\n💡 Solución: El script de consola es más simple. Úsalo en su lugar.');
                throw error2;
            }
        }

        const pages = await this.browser.pages();
        this.page = pages[0] || await this.browser.newPage();

        // Navegar a Twitter
        console.log('📱 Navegando a Twitter/X...');
        await this.page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' });

        console.log('\n⚠️  IMPORTANTE:');
        console.log('1. Verifica que estés logueado');
        console.log('2. Ve a tu perfil');
        console.log('3. Click en la pestaña "Replies"');
        console.log('4. Presiona Enter cuando estés listo...\n');

        // Esperar input del usuario
        await this.waitForUserInput();
    }

    // Esperar input del usuario
    async waitForUserInput() {
        return new Promise((resolve) => {
            process.stdin.once('data', () => {
                resolve();
            });
        });
    }

    // Función para hacer scroll
    async scrollToLoadMore() {
        await this.page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await this.randomDelay(this.config.scrollDelay, this.config.scrollDelay + 500);
    }

    // Obtener tweets visibles
    async getVisibleReplies() {
        return await this.page.$$('[data-testid="tweet"]');
    }

    // Eliminar un tweet
    async deleteTweet(tweet) {
        try {
            // 1. Click en el botón "More" (...)
            const moreButton = await tweet.$('[aria-label*="More"]');
            if (!moreButton) {
                console.log('⚠️  No se encontró el botón More');
                return false;
            }

            await moreButton.click();
            await this.randomDelay(800, 1200);

            // 2. Buscar y hacer click en "Delete"
            const deleteButton = await this.page.evaluateHandle(() => {
                const menuItems = document.querySelectorAll('[role="menuitem"]');
                for (let item of menuItems) {
                    if (item.innerText.includes('Delete') || item.innerText.includes('Eliminar')) {
                        return item;
                    }
                }
                return null;
            });

            if (!deleteButton || !deleteButton.asElement()) {
                console.log('⚠️  No se encontró el botón Delete');
                await this.page.click('body'); // Cerrar menú
                return false;
            }

            await deleteButton.asElement().click();
            await this.randomDelay(800, 1200);

            // 3. Confirmar eliminación
            const confirmButton = await this.page.$('[data-testid="confirmationSheetConfirm"]');
            if (!confirmButton) {
                console.log('⚠️  No se pudo confirmar la eliminación');
                return false;
            }

            await confirmButton.click();
            await this.randomDelay(1000, 1500);

            return true;

        } catch (error) {
            console.error('❌ Error al eliminar tweet:', error.message);
            return false;
        }
    }

    // Proceso principal
    async processReplies() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🗑️  Iniciando eliminación de replies...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        let consecutiveFailures = 0;
        let batchCount = 0;

        while (true) {
            // Obtener replies visibles
            const replies = await this.getVisibleReplies();

            if (replies.length === 0) {
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('✅ No se encontraron más replies para eliminar');
                break;
            }

            console.log(`📊 Replies encontrados en pantalla: ${replies.length}`);
            console.log(`🗑️  Procesando el siguiente reply...`);

            // Procesar el primer reply
            const success = await this.deleteTweet(replies[0]);

            if (success) {
                this.deletedCount++;
                consecutiveFailures = 0;
                console.log(`✅ Reply #${this.deletedCount} eliminado con éxito\n`);

                // Hacer scroll
                await this.scrollToLoadMore();

                // Pausa después de cada lote
                batchCount++;
                if (batchCount >= this.config.batchSize) {
                    console.log(`⏸️  Pausa de ${this.config.pauseAfterBatch / 1000}s después de ${this.config.batchSize} eliminaciones\n`);
                    await this.randomDelay(this.config.pauseAfterBatch, this.config.pauseAfterBatch + 2000);
                    batchCount = 0;
                }

            } else {
                this.errorCount++;
                consecutiveFailures++;
                console.log(`⚠️  Fallo al eliminar (${consecutiveFailures}/${this.config.maxRetries})\n`);

                if (consecutiveFailures >= this.config.maxRetries) {
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('❌ Demasiados fallos consecutivos. Deteniendo...');
                    break;
                }

                await this.scrollToLoadMore();
            }

            // Delay entre operaciones
            await this.randomDelay();
        }
    }

    // Mostrar resumen
    showSummary() {
        const endTime = Date.now();
        const duration = Math.floor((endTime - this.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RESUMEN FINAL');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Replies eliminados: ${this.deletedCount}`);
        console.log(`❌ Errores: ${this.errorCount}`);
        console.log(`⏱️  Tiempo total: ${minutes}m ${seconds}s`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Cerrar navegador
    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    // Ejecutar
    async run() {
        try {
            await this.initBrowser();
            await this.processReplies();
        } catch (error) {
            console.error('❌ Error fatal:', error);
        } finally {
            this.showSummary();
            await this.close();
        }
    }
}

// Ejecutar el script
(async () => {
    const deleter = new TwitterRepliesDeleter();
    await deleter.run();
    process.exit(0);
})();
