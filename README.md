# Library — Squashberry

A responsive, iOS-inspired study web app for your uploaded learning materials, with animated transitions, numbered file IDs, prompt templates, document previews and a direct-to-GitHub upload flow.

## Website
Expected GitHub Pages URL: https://squashberry.github.io/Read/

**Source repository:** https://github.com/squashberry/Read

### One-time GitHub Pages setup
Open the repository's **Settings → Pages**: https://github.com/squashberry/Read/settings/pages

Under **Build and deployment**, choose **Deploy from a branch**, select branch **master** and folder **/(root)**, then save. The root index.html is the website; .nojekyll is included. After Pages finishes activating, use https://squashberry.github.io/Read/. New commits to master publish directly through GitHub Pages. The site is not intended to be hosted on Render.

## Features
- Dynamically lists learning material in this repository, searchable by topic and filtered by file type.
- Assigns stable numeric IDs via library-index.json, so a learner can tell ChatGPT to use e.g. file ID 012.
- Provides document previews where the browser or online Office viewer supports them.
- Offers copy-ready prompts for reading, full lectures, exams, flashcards, clinical case practice, revision notes, oral viva, explanations and revision planning.
- Uploads files directly to GitHub through the Contents API, using a fine-grained token supplied for that session. The token is not stored in localStorage.
- Includes a morphing splash screen, welcome greeting, glass-style floating nav, dark/light mode and responsive layout.

## Critical instructions for ChatGPT
When a user asks to read, study or assess this library:
1. Inspect library-index.json ONLY as a catalogue for mapping file IDs to document paths. Do not teach from the manifest.
2. Read only actual uploaded learning materials registered with kind: study-material—such as PowerPoint, PDF, Word or study text documents.
3. **Never send, quote, summarize, display, read aloud or explain website/source/config files as study material.** In particular, ignore index.html, README.md, llms.txt, library-index.json, .gitignore, .nojekyll, .github/**, workflow files, HTML/CSS/JavaScript, and any build or configuration files.
4. If the user requests a numbered file such as 012, resolve that ID in library-index.json and use only its corresponding uploaded teaching document. Do not guess what an ID refers to.
5. If a document cannot be retrieved or its slides/pages cannot be extracted, state that limitation plainly. Never claim to have read a file you did not access.
6. Cite the actual teaching filename and slide/page where possible. Separate source content from extra explanation.
7. For nursing and clinical topics, teach for educational use and remind learners to verify clinical decisions against current institutional guidance.

## Uploads and privacy
This repository is public. The site's “private library” wording is a theme, not an access-control guarantee. A file uploaded here becomes public on GitHub and its contents may be downloaded by anyone. Never upload confidential documents, patient-identifying information, passwords, API keys, or other sensitive material.

For uploads, use a fine-grained GitHub personal access token limited to the squashberry/Read repository with **Contents: Read and write**. Paste it into the uploader only when needed. It is sent to GitHub for the API request and is not saved by this site. Keep the token secret and revoke it from GitHub settings if exposed.
