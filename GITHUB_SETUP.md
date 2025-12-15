# GitHub Setup Guide

This project is ready to be pushed to GitHub. Follow the steps below.

## 1. Initialize Git (If not already done)
Open your terminal in this folder and run:

```bash
git init
```

## 2. Commit Changes
We have automatically created a `.gitignore` file for you, so `node_modules` will be safely ignored.

```bash
git add .
git commit -m "Initial commit: PDF Editor with Fixes"
```

## 3. Rename Branch
Ensure your main branch is named `main`:

```bash
git branch -M main
```

## 4. Connect to GitHub
1.  Go to [GitHub.com](https://github.com/new) and create a **new empty repository**.
2.  Copy the URL (e.g., `https://github.com/Start-Up-Simplified/pdf-editor.git`).
3.  Run the command below (replace `<YOUR_REPO_URL>` with your actual link):

```bash
git remote add origin <YOUR_REPO_URL>
```

## 5. Push Code
Send your code to GitHub:

```bash
git push -u origin main
```

---

## Technical Summary of Work Done
*   **Scroll & Sidebar Fixed**: Removed duplicate scroll containers and implemented active page tracking.
*   **Alignment Fixed**: Flipped logic so "Align Top" aligns to the visual top (Max Y).
*   **Shortcuts**: Restored Shift-based shortcuts (`Cmd+Shift+T/B`) for alignment.
*   **Cleanup**: Removed debug console logs.
*   **Build**: Validated `npm run build` succeeds.
