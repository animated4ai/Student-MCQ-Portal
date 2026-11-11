# Student MCQ Portal

A free, offline student practice portal — **Developed by Code Brothers**.

Class-wise MCQs for **Class 3–8** (English, Urdu, Maths; Science from Class 6),
plus a Mixed Test per class. Every test is **9 questions • 9 marks • 5 minutes**
(Mixed Test: 9 questions for Classes 3–5, 12 for Classes 6–8).
No login, no server, no internet needed — it runs by opening one file.

## What is inside

| File | What it does |
|---|---|
| `index.html` | The whole portal page (home, subjects, test, results) |
| `css/style.css` | All colours and layout (plain CSS, no framework) |
| `js/questions.js` | The question bank — 378 original questions |
| `js/app.js` | Test engine, timer, results, best scores |
| `README.md` | This file |

## How to run it (Cursor, Windows laptop)

1. Copy this `mcq-portal` folder into Cursor (File → Open Folder → choose `mcq-portal`).
2. Open `index.html` — or right-click it and choose **Open with Live Server** if you have the Live Server extension.
3. Or simply **double-click `index.html`** in Windows Explorer — it opens in any browser (Chrome, Edge, Firefox) and works fully offline.
4. That is all. There is nothing to install: no Node, no Python, no database, no build step. It also works on Mac, Linux and Android the same way.

## How to add more questions

1. Open `js/questions.js` in Cursor.
2. Find the class and subject, e.g. `"6": { "Maths": [ ... ] }`.
3. Add one line per question (keep the commas right):
   ```js
   {q:"What is 6 × 7?", o:["40","41","42","43"], a:2},
   ```
   - `q` — the question stem.
   - `o` — exactly **4** options.
   - `a` — the index of the correct option (**0** = first, **1** = second, **2** = third, **3** = fourth).
   - Optional: `u:"..."` — a short Urdu translation line shown under the stem.
   - Optional: `e:"..."` — a 1-line explanation shown in the answer review.
4. Save, refresh the browser. The test draws 9 random questions per test, so new questions appear automatically.

## How to publish it free on GitHub Pages (optional)

1. On GitHub, create a new public repository (e.g. `student-mcq-portal`).
2. Upload this whole `mcq-portal` folder's contents (or push with Git).
3. Go to the repository **Settings → Pages**.
4. Under "Build and deployment", set Source to **Deploy from a branch**, Branch to **main**, Folder to **/ (root)**.
5. Save — after a minute your portal is live at `https://<your-username>.github.io/student-mcq-portal/`.

## Notes

- Best scores are saved in the browser (localStorage) per class + subject, and shown as "Best: x/9" on the subject cards.
- The 5-minute timer auto-submits the test at 0:00. Unanswered questions count as wrong.
- Urdu questions are shown in Urdu script (right-to-left). The portal uses system fonts only, so it works offline on any computer.
- "Download / Print Result" on the results screen opens the browser print dialog with a clean result-only layout.
