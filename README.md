# Library — Squashberry

Library is a mobile-first, installable study web app for your uploaded learning materials. It has a four-tab floating glass navigation inspired by the BerreX interface, warm brown-and-white styling, numbered source files, copy-ready AI prompts and browser-based uploads that update the numbered file catalogue automatically.

## Host: GitHub Pages
Expected site URL: **https://squashberry.github.io/Read/**

### One-time activation
Open **Settings → Pages** at https://github.com/squashberry/Read/settings/pages. Under **Build and deployment**, select **Deploy from a branch**, choose branch **master** and folder **/(root)**, then save.

The root index.html is the application. The manifest.webmanifest, icon.svg and sw.js files provide installation metadata, an app icon and an offline app shell. After Pages finishes activating, the app will be available at the URL above, and commits to master will update the live site.

## Web-app features
- Home, Library, Prompts and You tabs in a floating, glass-style navigation bar.
- Mobile-first layouts, safe-area-aware bottom navigation, responsive file cards and animated sheets/popups.
- Install-to-home-screen support and a service worker for caching the app shell.
- Search/filter the study library and preview compatible files.
- Stable numeric IDs in library-index.json (for example, file ID 012).
- Copyable prompts for reading, full lectures, exams, flashcards, clinical case practice, revision notes, oral viva, explanations and planning.
- Upload study files to this GitHub repository using the browser's GitHub Contents API. Users provide a fine-grained token only for the upload session; the site does not save it.
- A friend/classmate sharing popup; its primary action copies the share message and changes to “Copied!”.

## Critical instructions for ChatGPT
When a user asks to read, study or assess Library:
1. Read library-index.json **only as a catalogue** for mapping file IDs to source-document paths. Never teach from the catalogue.
2. Study only actual uploaded learning materials registered with kind: study-material, such as PowerPoint, PDF, Word and study-text documents.
3. **Never send, quote, summarize, display, read aloud or explain website/source/config files as study material.** Ignore index.html, README.md, llms.txt, library-index.json, .gitignore, .nojekyll, .github/**, workflow files, HTML/CSS/JavaScript and build/configuration files.
4. For a request such as “use file 012”, resolve that exact ID using library-index.json and open only the corresponding uploaded teaching document. Never guess an ID or substitute website code.
5. If the document cannot be retrieved or its text/slides cannot be extracted, say so plainly. Never claim to have read content that was inaccessible.
6. Cite the actual study filename and slide/page where possible. Distinguish information from the source from supplementary teaching.
7. For nursing/clinical topics, teach for educational use and advise checking current institutional guidance for real clinical decisions.

## Privacy and upload warning
Library materials are publicly accessible and can be downloaded by anyone. “Private library” is the brand/theme, not an access-control guarantee. Do not upload confidential documents, patient-identifying information, passwords, API keys or anything the uploader is not allowed to share.

For uploads, use a fine-grained GitHub personal access token scoped only to squashberry/Read with **Contents: Read and write**. Paste it into the uploader for the session only. The token is not stored in localStorage; keep it secret and revoke it if exposed.
