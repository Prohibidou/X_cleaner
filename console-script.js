/**
 * TWITTER/X REPLIES DELETER - Console Script [v4.2 STABLE]
 * ==========================================================
 * 
 * INSTRUCTIONS:
 * 1. Open Twitter/X and go to your profile
 * 2. Click on the "Replies" tab
 * 3. Open browser console (F12)
 * 4. Paste this entire script and press Enter
 * 5. The script will start deleting ONLY YOUR replies
 * 
 * IMPROVEMENTS v4.2:
 * - ✅ Active wait until menu loads completely
 * - ✅ Retry system when menu is empty
 * - ✅ User filter (only deletes YOUR replies)
 * - ✅ Robust error and timing handling
 */

(async function deleteAllReplies() {
    console.log('🚀 Starting X Cleaner [v4.2 STABLE]');
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

    // IMPROVED FUNCTION WITH ACTIVE WAITING
    const deleteTweet = async (article) => {
        try {
            await closeOpenMenus();
            article.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await randomDelay(400, 600);

            const moreButton = findMoreButton(article);
            if (!moreButton) {
                console.log('  ⚠️  More button not found');
                return 'skip';
            }

            console.log('  → Opening menu...');
            moreButton.click();

            // ACTIVE WAIT: Wait until menu has options loaded
            let menuLoaded = false;
            let waitAttempts = 0;
            const maxWaitAttempts = 10; // 10 x 500ms = 5 seconds

            while (!menuLoaded && waitAttempts < maxWaitAttempts) {
                await randomDelay(500, 600);
                const menuItems = document.querySelectorAll('[role="menuitem"]');

                if (menuItems.length > 0) {
                    menuLoaded = true;
                    console.log(`  → ✓ Menu loaded (${menuItems.length} options)`);
                } else {
                    waitAttempts++;
                }
            }

            // If menu didn't load, RETRY ONCE
            if (!menuLoaded) {
                console.log('  → ⏳ Menu empty, retrying...');
                await closeOpenMenus();
                await randomDelay(1500, 2000);

                article.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await randomDelay(600, 800);
                moreButton.click();
                await randomDelay(3000, 3500);

                const menuItems = document.querySelectorAll('[role="menuitem"]');
                if (menuItems.length === 0) {
                    console.log('  → ❌ Menu still empty');
                    await closeOpenMenus();
                    return 'skip';
                }
                console.log(`  → ✓ Menu loaded on 2nd attempt (${menuItems.length} options)`);
            }

            const deleteButton = findDeleteButton();
            if (!deleteButton) {
                console.log('  ⚠️  Delete not found (not your reply)');
                await closeOpenMenus();
                return 'skip';
            }

            console.log('  → ✓ Delete found');
            deleteButton.click();
            await randomDelay(900, 1300);

            const confirmed = await confirmDelete();
            if (!confirmed) {
                console.log('  ⚠️  Could not confirm');
                await closeOpenMenus();
                return 'error';
            }

            console.log('  → ✓ Confirmed');
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
            console.error('❌ Could not detect username');
            return;
        }

        console.log(`✅ User: @${username}`);
        console.log('\n🔍 Searching for your replies...\n');

        let consecutiveSkips = 0;
        let batchCount = 0;

        while (isRunning) {
            attemptCount++;
            await scrollToLoadMore();

            const replies = getUserReplies(username);
            const currentReplyCount = replies.length;

            console.log(`\n📊 Attempt #${attemptCount} - Your tweets: ${currentReplyCount}`);

            if (currentReplyCount === 0) {
                consecutiveSkips++;
                console.log(`⚠️  No replies found (${consecutiveSkips}/${config.maxConsecutiveSkips})`);

                if (consecutiveSkips >= config.maxConsecutiveSkips) {
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('✅ No more replies to delete');
                    break;
                }

                await randomDelay(2000, 3000);
                continue;
            }

            consecutiveSkips = 0;
            console.log(`🗑️  Processing reply...`);
            const result = await deleteTweet(replies[0]);

            if (result === 'success') {
                deletedCount++;
                console.log(`✅ Reply #${deletedCount} deleted\n`);

                batchCount++;
                if (batchCount >= config.batchSize) {
                    console.log(`⏸️  Pause (${config.pauseAfterBatch}ms)...\n`);
                    await randomDelay(config.pauseAfterBatch, config.pauseAfterBatch + 1000);
                    batchCount = 0;
                }
            } else if (result === 'skip') {
                skippedCount++;
                console.log(`⏭️  Skipped (${skippedCount} total)\n`);
            } else {
                errorCount++;
                console.log(`❌ Error (${errorCount} total)\n`);
            }

            await randomDelay();
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
