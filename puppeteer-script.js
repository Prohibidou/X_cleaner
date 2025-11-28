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

    // Process a tweet (Delete or Undo Retweet)
    async processTweet(tweet) {
        try {
            // 1. Click on "More" button (...)
            // Try multiple selectors for the More button to be robust across languages
            const moreButton = await tweet.$('[aria-label*="More"], [aria-label*="Más"], [data-testid="caret"]');

            if (!moreButton) {
                return { status: 'skipped', reason: 'no_more_button' };
            }

            await moreButton.click();

            // Wait for menu to appear
            try {
                await this.page.waitForSelector('[role="menu"]', { timeout: 2000 });
            } catch (e) {
                // If menu doesn't appear, maybe click failed or it's not interactive
                return { status: 'skipped', reason: 'menu_not_opened' };
            }

            // 2. Check for available actions in the menu
            const action = await this.page.evaluate(() => {
                const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));

                // Check for Delete option
                const deleteBtn = menuItems.find(item =>
                    item.innerText.includes('Delete') ||
                    item.innerText.includes('Eliminar')
                );
                if (deleteBtn) return { type: 'delete', text: deleteBtn.innerText };

                // Check for Undo Retweet/Repost option
                const undoRetweetBtn = menuItems.find(item =>
                    item.innerText.includes('Undo Repost') ||
                    item.innerText.includes('Deshacer repost') ||
                    item.innerText.includes('Undo Retweet') ||
                    item.innerText.includes('Deshacer retweet')
                );
                if (undoRetweetBtn) return { type: 'undo_retweet', text: undoRetweetBtn.innerText };

                return null;
            });

            if (!action) {
                // Not my tweet (no delete option) or not a retweet I can undo
                // Close menu by clicking body
                await this.page.click('body');
                await this.randomDelay(300, 500);
                return { status: 'skipped', reason: 'not_my_tweet' };
            }

            // 3. Execute the action
            const actionButton = await this.page.evaluateHandle((actionType) => {
                const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
                if (actionType === 'delete') {
                    return menuItems.find(item => item.innerText.includes('Delete') || item.innerText.includes('Eliminar'));
                } else {
                    return menuItems.find(item =>
                        item.innerText.includes('Undo Repost') ||
                        item.innerText.includes('Deshacer repost') ||
                        item.innerText.includes('Undo Retweet') ||
                        item.innerText.includes('Deshacer retweet')
                    );
                }
            }, action.type);

            if (actionButton && actionButton.asElement()) {
                await actionButton.asElement().click();
                await this.randomDelay(800, 1200);

                // 4. Confirm action if necessary
                const confirmButton = await this.page.$('[data-testid="confirmationSheetConfirm"]');
                if (confirmButton) {
                    await confirmButton.click();
                    await this.randomDelay(1500, 2000); // Wait for animation
                }

                return { status: 'success', type: action.type };
            }

            return { status: 'error', reason: 'button_click_failed' };

        } catch (error) {
            // Try to close menu if open to reset state
            try { await this.page.click('body'); } catch (e) { }
            return { status: 'error', reason: error.message };
        }
    }

    // Main process
    async processReplies() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🗑️  Starting cleanup (Replies & Retweets)...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        let consecutiveEmptyScrolls = 0;
        let batchCount = 0;

        while (true) {
            // Reset index for the new view
            let index = 0;
            let somethingDeletedInThisView = false;

            // Loop through visible items
            while (true) {
                // Refresh list of tweets because DOM changes after deletion
                const currentTweets = await this.getVisibleReplies();

                if (index >= currentTweets.length) {
                    // Processed all visible items
                    break;
                }

                // console.log(`🔍 Checking item ${index + 1}/${currentTweets.length}...`);
                const targetTweet = currentTweets[index];

                const result = await this.processTweet(targetTweet);

                if (result.status === 'success') {
                    this.deletedCount++;
                    console.log(`✅ ${result.type === 'delete' ? 'Deleted' : 'Undid Retweet'} item #${this.deletedCount}`);
                    somethingDeletedInThisView = true;

                    // Since we deleted an item, the list shifted up. 
                    // The item at 'index' is now a NEW item (the one that was at index+1).
                    // So we do NOT increment index.

                    // Pause periodically
                    batchCount++;
                    if (batchCount >= this.config.batchSize) {
                        console.log(`⏸️  Pausing for ${this.config.pauseAfterBatch / 1000}s...`);
                        await this.randomDelay(this.config.pauseAfterBatch, this.config.pauseAfterBatch + 2000);
                        batchCount = 0;
                    } else {
                        await this.randomDelay(1000, 1500);
                    }

                } else {
                    // If skipped or error, we move to the next item
                    if (result.status === 'error') {
                        console.log(`⚠️  Error on item: ${result.reason}`);
                        this.errorCount++;
                    }
                    // If skipped (not my tweet), just move on
                    index++;
                }
            }

            // If we finished the loop and deleted something, we might want to check again before scrolling?
            // But usually scrolling is safe now.

            if (!somethingDeletedInThisView) {
                console.log(`⬇️  No more deletable items visible (${consecutiveEmptyScrolls}/5). Scrolling...`);
                await this.scrollToLoadMore();
                consecutiveEmptyScrolls++;

                if (consecutiveEmptyScrolls >= 5) {
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('❌ No new items found after multiple scrolls. Stopping.');
                    break;
                }
            } else {
                // We deleted something, so we made progress. Reset empty scroll counter.
                consecutiveEmptyScrolls = 0;
                // Scroll to bring new items into view
                await this.scrollToLoadMore();
            }

            // Delay between screens
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
