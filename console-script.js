/**
 * TWITTER/X REPLIES DELETER - Console Script [v5.1 STABLE]
 * ==========================================================
 * 
 * INSTRUCTIONS:
 * 1. Open Twitter/X and go to your profile
 * 2. Click on the "Replies" tab
 * 3. Open browser console (F12)
 * 4. Paste this entire script and press Enter
 * 5. The script will start deleting ONLY YOUR replies
 */

(async function deleteAllReplies() {
    console.log('🚀 Starting X Cleaner [v5.1 STABLE]');
    console.log('⚠️  To stop: reload page (F5)');
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

    // --- HELPER FUNCTIONS ---

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
        const overlay = document.querySelector('[data-testid="mask"]');
        if (overlay) overlay.click();
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

    const findMoreButton = (article) => {
        // 1. Look for 'More' or 'Más' aria-label
        const buttons = article.querySelectorAll('button[aria-label]');
        for (let btn of buttons) {
            const label = btn.getAttribute('aria-label').toLowerCase();
            if (label.includes('more') || label.includes('más') || label.includes('mas')) {
                return btn;
            }
        }

        // 2. Look for caret icon (data-testid="caret")
        const caretButton = article.querySelector('[data-testid="caret"]');
        if (caretButton) return caretButton;

        // 3. Fallback: Look for the last button in the action group (usually Share or More)
        const actionGroup = article.querySelector('[role="group"]');
        if (actionGroup) {
            const actionButtons = actionGroup.querySelectorAll('button');
            if (actionButtons.length > 0) {
                return actionButtons[actionButtons.length - 1];
            }
        }

        return null;
    };

    const findActionInMenu = () => {
        const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));

        // Check for Delete
        const deleteBtn = menuItems.find(item => {
            const text = (item.textContent || item.innerText || '').toLowerCase();
            const testId = item.getAttribute('data-testid') || '';
            return text.includes('delete') ||
                text.includes('eliminar') ||
                text.includes('borrar') ||
                testId === 'Dropdown-Delete';
        });
        if (deleteBtn) return { type: 'delete', element: deleteBtn };

        // Check for Undo Retweet
        const undoRetweetBtn = menuItems.find(item => {
            const text = (item.textContent || item.innerText || '').toLowerCase();
            const testId = item.getAttribute('data-testid') || '';
            return text.includes('undo repost') ||
                text.includes('deshacer repost') ||
                text.includes('undo retweet') ||
                text.includes('deshacer retweet') ||
                testId === 'Dropdown-Retweet';
        });
        if (undoRetweetBtn) return { type: 'undo_retweet', element: undoRetweetBtn };

        return null;
    };

    const confirmDelete = async () => {
        await randomDelay(600, 900);
        let confirmButton = document.querySelector('[data-testid="confirmationSheetConfirm"]');
        if (!confirmButton) {
            const dialogButtons = document.querySelectorAll('[role="button"]');
            for (let btn of dialogButtons) {
                const text = (btn.textContent || '').trim().toLowerCase();
                if (text === 'delete' || text === 'eliminar' || text === 'borrar') {
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

    // --- MAIN LOGIC ---

    const processTweet = async (article) => {
        try {
            await closeOpenMenus();
            article.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await randomDelay(400, 600);

            const moreButton = findMoreButton(article);
            if (!moreButton) {
                return { status: 'skip', reason: 'no_more_button' };
            }

            moreButton.click();

            // ACTIVE WAIT: Wait until menu has options loaded
            let menuLoaded = false;
            let waitAttempts = 0;
            const maxWaitAttempts = 6; // 3 seconds max

            while (!menuLoaded && waitAttempts < maxWaitAttempts) {
                await randomDelay(400, 500);
                const menuItems = document.querySelectorAll('[role="menuitem"]');
                if (menuItems.length > 0) menuLoaded = true;
                else waitAttempts++;
            }

            // If menu didn't load, RETRY ONCE
            if (!menuLoaded) {
                await closeOpenMenus();
                await randomDelay(500, 800);
                moreButton.click();
                await randomDelay(1000, 1500);

                const menuItems = document.querySelectorAll('[role="menuitem"]');
                if (menuItems.length === 0) {
                    await closeOpenMenus();
                    return { status: 'skip', reason: 'menu_empty' };
                }
            }

            const action = findActionInMenu();
            if (!action) {
                await closeOpenMenus();
                return { status: 'skip', reason: 'not_my_tweet' };
            }

            console.log(`  → ✓ Found action: ${action.type}`);
            action.element.click();
            await randomDelay(900, 1300);

            const confirmed = await confirmDelete();
            if (!confirmed && action.type === 'delete') {
                if (document.querySelector('[role="menu"]')) {
                    console.log('  ⚠️  Could not confirm');
                    await closeOpenMenus();
                    return { status: 'error', reason: 'confirmation_failed' };
                }
            }

            console.log('  → ✓ Action completed');
            await randomDelay(config.waitAfterDelete, config.waitAfterDelete + 500);
            return { status: 'success', type: action.type };

        } catch (error) {
            console.error('  ❌ Error:', error.message);
            await closeOpenMenus();
            return { status: 'error', reason: error.message };
        }
    };

    const processReplies = async () => {
        console.log('\n🔍 Searching for tweets/replies...\n');

        let consecutiveEmptyScrolls = 0;
        let batchCount = 0;

        while (isRunning) {
            attemptCount++;

            // Get all visible tweets
            const articles = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
            console.log(`\n📊 Scan #${attemptCount} - Visible tweets: ${articles.length}`);

            if (articles.length === 0) {
                consecutiveEmptyScrolls++;
                console.log(`⚠️  No tweets visible (${consecutiveEmptyScrolls}/5)`);
                if (consecutiveEmptyScrolls >= 5) {
                    console.log('✅ No more tweets found. Stopping.');
                    break;
                }
                await scrollToLoadMore();
                continue;
            }

            let somethingProcessedInThisView = false;

            // Iterate through all visible articles
            for (let i = 0; i < articles.length; i++) {
                if (!isRunning) break;

                const article = articles[i];

                // Visual indicator of processing
                article.style.border = "2px solid orange";

                const result = await processTweet(article);

                article.style.border = "none";

                if (result.status === 'success') {
                    deletedCount++;
                    somethingProcessedInThisView = true;
                    consecutiveEmptyScrolls = 0; // Reset scroll counter

                    console.log(`✅ Item #${deletedCount} processed (${result.type})\n`);

                    batchCount++;
                    if (batchCount >= config.batchSize) {
                        console.log(`⏸️  Pause (${config.pauseAfterBatch}ms)...\n`);
                        await randomDelay(config.pauseAfterBatch, config.pauseAfterBatch + 1000);
                        batchCount = 0;
                    }

                    // Since DOM changed (element removed), we should probably stop this loop and re-scan
                    break;
                } else if (result.status === 'skip') {
                    // Just continue to next item
                } else {
                    errorCount++;
                    console.log(`❌ Error: ${result.reason}\n`);
                }
            }

            if (!somethingProcessedInThisView) {
                console.log(`⬇️  Nothing actionable in this view. Scrolling...`);
                await scrollToLoadMore();
            } else {
                await randomDelay(1000, 1500);
            }

            await randomDelay(500, 1000);
        }
    };

    window.stopDeletingReplies = () => {
        isRunning = false;
        console.log('\n🛑 Stopping...');
    };

    try {
        await processReplies();
    } catch (error) {
        console.error('❌ Fatal error:', error);
    }

    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FINAL SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Deleted: ${deletedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`🔄 Attempts: ${attemptCount}`);
    console.log(`⏱️  Time: ${minutes}m ${seconds}s`);
    if (deletedCount > 0) {
        const avgTime = Math.floor(duration / deletedCount);
        console.log(`⏱️  Average: ${avgTime}s/reply`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Reload (F5) if more replies remain');

})();
