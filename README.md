# Squashberry Library

Squashberry Library is a mobile-first, installable study web app for organising learning files, reading course materials, practising exams and revising with ChatGPT.

**Website:** https://squashberry.github.io/Read/  
**ChatGPT study guide:** https://squashberry.github.io/Read/gptinstruction/

## Website features

- Four-tab floating navigation with an animated active-tab indicator: Home, Library, Prompts and You.
- Light-first design, warm brown accents, responsive layouts, touch-friendly animations and reduced-motion support.
- Searchable, numbered learning files with a live catalogue refresh.
- Ready-to-copy study prompts for explanations, lectures, exams, flashcards, clinical cases and revision notes.
- Install-to-home-screen support, offline app shell, social sharing metadata and preview artwork.
- Direct links to the short ChatGPT study guide rather than a long technical prompt in the app.

## Hosting

The site is a static GitHub Pages app at **https://squashberry.github.io/Read/**. The root `index.html` is the main app; `gptinstruction/index.html` serves the readable ChatGPT guide. Pages must be enabled once in repository Settings → Pages, with branch `master` and folder `/(root)`. After it is enabled, commits to `master` update the live website.

## Upload options

### Simple upload without a GitHub account

The site includes a Cloudflare Worker backend in `upload-worker/worker.js` that can receive uploads without asking students for personal tokens or a GitHub account. It stores the repository write token as a Cloudflare secret, requires Cloudflare Turnstile, applies file-type/size limits and uses a KV daily counter. See `upload-worker/README.md` for the one-time setup, then set the public Worker endpoint and Turnstile site key in `upload-config.js`.

**The Worker source is committed but is not deployed by GitHub Pages.** Until you create the Worker and fill in `upload-config.js`, the site falls back to the current temporary-token uploader. Never put the secret GitHub token or Turnstile secret in website files.

### Public-file warning

Files added to Library are public and can be downloaded by anyone. Never upload private records, patient-identifying information, passwords, API keys or anything you are not allowed to share.

## Study-source rules used by the ChatGPT guide

The instruction page tells ChatGPT to use `library-index.json` only to map a numbered file to its learning document, and to study only files registered as `kind: study-material`. Website source, instructions, catalogue metadata, HTML/CSS/JavaScript, manifest and workflow files must not be treated as teaching material. If a document cannot be opened or extracted, ChatGPT should say so honestly and never pretend it has read it. Nursing and clinical content is for study only; real care must follow current institutional guidance and qualified supervision.
