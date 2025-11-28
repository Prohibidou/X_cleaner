const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');

/**
 * TWITTER/X REPLIES DELETER - Automated Script with Puppeteer
 * ============================================================
 * 
 * This script uses your existing Chrome/Edge session to delete replies
 */

class TwitterRepliesDeleter {
    constructor() {
        this.deletedCount = 0;
        this.errorCount = 0;
        this.startTime = Date.now();

        // Configuration
        this.config = {
            minDelay: 2000,
            maxDelay: 5000,
            scrollDelay: 1500,
            maxRetries: 3,
            batchSize: 10,
            pauseAfterBatch: 8000,
            headless: false, // Show the browser

            // Browser profile paths (adjust according to your configuration)
            chromeProfilePath: path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data'),
            edgeProfilePath: path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data'),
        };
    }

    // Random wait
    async randomDelay(min = this.config.minDelay, max = this.config.maxDelay) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Initialize browser
    async initBrowser() {
        console.log('🚀 Starting browser...');

        try {
            // Try with Chrome profile
            this.browser = await puppeteer.launch({
                headless: this.config.headless,
                userDataDir: this.config.chromeProfilePath,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                ]
            });

            console.log('✅ Browser started with Chrome profile');
        } catch (error) {
            console.log('⚠️  Could not use Chrome, trying Edge...');

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

                console.log('✅ Browser started with Edge profile');
            } catch (error2) {
                console.error('❌ Error starting browser:', error2.message);
                console.log('\n💡 Solution: The console script is simpler. Use it instead.');
                throw error2;
            }
        }

        const pages = await this.browser.pages();
        this.page = pages[0] || await this.browser.newPage();

        // Navigate to Twitter
        console.log('📱 Navigating to Twitter/X...');
        await this.page.goto('https://twitter.com/home', { waitUntil: 'networkidle2' });

        console.log('\n⚠️  IMPORTANT:');
        console.log('1. Verify that you are logged in');
        console.log('2. Go to your profile');
        console.log('3. Click on the "Replies" tab');
        console.log('4. Press Enter when ready...\n');

        // Wait for user input
        await this.waitForUserInput();
    }

    // Wait for user input
    async waitForUserInput() {
        return new Promise((resolve) => {
            process.stdin.once('data', () => {
                resolve();
            });
        });
    }

    // Function to scroll
    async scrollToLoadMore() {
        await this.page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await this.randomDelay(this.config.scrollDelay, this.config.scrollDelay + 500);
    }

    // Get visible tweets
    async getVisibleReplies() {
        return await this.page.$$('[data-testid="tweet"]');
    }

    // Delete a tweet
    async deleteTweet(tweet) {
        try {
            // 1. Click on "More" button (...)
            const moreButton = await tweet.$('[aria-label*="More"]');
            if (!moreButton) {
                console.log('⚠️  More button not found');
                return false;
            }

            await moreButton.click();
            await this.randomDelay(800, 1200);

            // 2. Find and click "Delete"
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
                console.log('⚠️  Delete button not found');
                await this.page.click('body'); // Close menu
                return false;
            }

            await deleteButton.asElement().click();
            await this.randomDelay(800, 1200);

            // 3. Confirm deletion
            const confirmButton = await this.page.$('[data-testid="confirmationSheetConfirm"]');
            if (!confirmButton) {
                console.log('⚠️  Could not confirm deletion');
                return false;
            }

            await confirmButton.click();
            await this.randomDelay(1000, 1500);

            return true;

        } catch (error) {
            console.error('❌ Error deleting tweet:', error.message);
            return false;
        }
    }

    // Main process
    async processReplies() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🗑️  Starting reply deletion...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        let consecutiveFailures = 0;
        let batchCount = 0;

        while (true) {
            // Get visible replies
            const replies = await this.getVisibleReplies();

            if (replies.length === 0) {
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('✅ No more replies found to delete');
                break;
            }

            console.log(`📊 Replies found on screen: ${replies.length}`);
            console.log(`🗑️  Processing next reply...`);

            // Process the first reply
            const success = await this.deleteTweet(replies[0]);

            if (success) {
                this.deletedCount++;
                consecutiveFailures = 0;
                console.log(`✅ Reply #${this.deletedCount} successfully deleted\n`);

                // Scroll
                await this.scrollToLoadMore();

                // Pause after each batch
                batchCount++;
                if (batchCount >= this.config.batchSize) {
                    console.log(`⏸️  ${this.config.pauseAfterBatch / 1000}s pause after ${this.config.batchSize} deletions\n`);
                    await this.randomDelay(this.config.pauseAfterBatch, this.config.pauseAfterBatch + 2000);
                    batchCount = 0;
                }

            } else {
                this.errorCount++;
                consecutiveFailures++;
                console.log(`⚠️  Failed to delete (${consecutiveFailures}/${this.config.maxRetries})\n`);

                if (consecutiveFailures >= this.config.maxRetries) {
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('❌ Too many consecutive failures. Stopping...');
                    break;
                }

                await this.scrollToLoadMore();
            }

            // Delay between operations
            await this.randomDelay();
        }
    }

    // Show summary
    showSummary() {
        const endTime = Date.now();
        const duration = Math.floor((endTime - this.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 FINAL SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Replies deleted: ${this.deletedCount}`);
        console.log(`❌ Errors: ${this.errorCount}`);
        console.log(`⏱️  Total time: ${minutes}m ${seconds}s`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Close browser
    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    // Execute
    async run() {
        try {
            await this.initBrowser();
            await this.processReplies();
        } catch (error) {
            console.error('❌ Fatal error:', error);
        } finally {
            this.showSummary();
            await this.close();
        }
    }
}

// Run the script
(async () => {
    const deleter = new TwitterRepliesDeleter();
    await deleter.run();
    process.exit(0);
})();
