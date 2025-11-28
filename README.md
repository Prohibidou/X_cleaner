# 🧹 X/Twitter Replies Cleaner

Tool to automatically delete all your Twitter/X replies.

## 📋 Available Options

### ✅ **Option 1: Console Script (Recommended)**

The simplest and most direct approach. No installation required.

#### 📝 Instructions:

1. **Open Twitter/X in your browser** (Chrome, Edge, Firefox, etc.)
2. **Log in** to your account
3. **Go to your profile** and click the **"Replies"** tab
4. Open the **Browser Console**:
   - Windows/Linux: `F12` or `Ctrl + Shift + J`
   - Mac: `Cmd + Option + J`
5. **Copy all content** from the `console-script.js` file
6. **Paste it in the console** and press `Enter`
7. The script will start deleting your replies automatically

#### ⚙️ Features:
- ✅ No installation required
- ✅ Works in any browser
- ✅ Uses your current session
- ✅ Random delays to avoid blocks
- ✅ Real-time progress display
- ✅ Automatic pauses every 3 deletions
- ✅ Can be stopped by reloading the page

---

### 🤖 **Option 2: Automated Script with Puppeteer**

Automated version that controls the browser. More complex but fully automatic.

#### 📦 Installation:

```bash
# Install dependencies
npm install
```

#### 🚀 Usage:

```bash
# Run the script
npm start
```

#### ⚙️ Important Note:
This script attempts to use your existing Chrome/Edge profile. If you have issues, use **Option 1** (console script) which is simpler.

---

## ⚠️ Important Warnings

1. **Rate Limiting**: Twitter/X has limits on actions per hour. The script includes random pauses to minimize the risk of being blocked.

2. **Irreversible Action**: Once a reply is deleted, **it cannot be recovered**.

3. **Use at Your Own Risk**: This tool is for personal use. Use it responsibly.

4. **Stop the Script**:
   - **Option 1**: Reload the page (F5)
   - **Option 2**: `Ctrl + C` in the terminal

---

## 📊 Features

- 🔄 Automatic one-by-one deletion
- ⏱️ Random delays (1-2 seconds)
- 📦 Batch processing (3 replies)
- ⏸️ Automatic pauses per batch (3 seconds)
- 📈 Real-time statistics
- ✅ Successful deletion counter
- ❌ Error counter
- 🔄 Automatic scroll to load more replies
- 🛡️ Rate limiting protection
- 🎯 User filter (only YOUR replies)
- ⏳ Active wait for menu loading
- 🔁 Retry system for failed attempts

---

## 🐛 Troubleshooting

### Script doesn't find "More" or "Delete" button

Twitter/X frequently changes its interface. If this happens:

1. Open browser console (`F12`)
2. Manually inspect a reply
3. Check the CSS selectors used
4. Update the script with new selectors

### Script stops

Possible causes:
- No more visible replies
- Twitter temporarily blocked actions
- Changes in Twitter's interface

**Solution**: Wait a few minutes and run the script again.

### Puppeteer doesn't work

Use **Option 1** (console script) which is more reliable and simple.

---

## 📝 Version History

### v4.2 STABLE
- ✅ Active wait system with while loop
- ✅ Intelligent retry system for empty menus
- ✅ Improved logging and feedback
- ✅ Optimized timing (500ms active checks)
- ✅ ~90%+ success rate on YOUR replies

### v4.1 WIP
- ⚠️ First attempt at active wait (had bugs)
- ⚠️ Increased menu wait time

### v1.0
- ✅ Console script implemented
- ✅ Puppeteer script implemented
- ✅ Random delays
- ✅ Batch pauses
- ✅ Real-time statistics
- ✅ User filtering

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

---

## 📄 License

MIT License - Personal use at your own responsibility.

---

## 💡 Tips

1. **Run the script during low activity hours** to minimize rate limiting risk
2. **Monitor the process** to detect any issues
3. **Save the logs** if you need to keep a record
4. **Be patient**: If you have many replies, the process can take time
5. **Keep the tab visible**: Some browsers throttle inactive tabs

---

## 🎯 Which option to choose?

### Use **Option 1** (Console Script) if:
- ✅ You want something simple and quick
- ✅ You don't want to install anything
- ✅ You have problems with Puppeteer
- ✅ You're not familiar with Node.js

### Use **Option 2** (Puppeteer) if:
- ✅ You want complete automation
- ✅ You're comfortable with Node.js
- ✅ You need more control over the process
- ✅ You want to schedule the task

---

**⭐ Recommendation**: Start with **Option 1** (Console Script). It's simpler and works in all cases.

---

## 🔧 Technical Details

### How it works:

1. **User Detection**: Automatically detects your logged-in username
2. **Tweet Filtering**: Only processes tweets authored by you
3. **Active Menu Wait**: Polls every 500ms until menu loads (max 5s)
4. **Retry Logic**: If menu fails to load, retries once with longer wait
5. **Delete Confirmation**: Finds and clicks confirmation button
6. **Rate Limiting**: Random delays and batch pauses

### Selectors Used:

- `article[data-testid="tweet"]` - Tweet articles
- `button[aria-label*="more"]` - More options button
- `[role="menuitem"]` - Menu items
- `[data-testid="confirmationSheetConfirm"]` - Confirmation button

### Success Rate:

- **v1.0**: ~30% (many empty menu issues)
- **v4.2 STABLE**: ~90%+ (active wait system)

---

## 🙏 Contributing

This is a personal project, but suggestions and improvements are welcome!

1. Fork the repository
2. Create your feature branch
3. Commit your changes (in English)
4. Push to the branch
5. Open a Pull Request

---

## ⚠️ Disclaimer

This tool automates browser actions on Twitter/X. Use responsibly and in accordance with Twitter's Terms of Service. The authors are not responsible for any account restrictions or bans that may result from use of this tool.
