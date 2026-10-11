# Library — Squashberry

Welcome to Squashberry's private library: a calm, iOS-inspired study web app for the files in this repository.

## Website
**Live site:** https://squashberry-library.onrender.com/

**Source repository:** https://github.com/squashberry/Read

## What it does
- Reads the file list directly from the public GitHub repository using the GitHub Contents API.
- Searches and filters uploaded materials.
- Provides browser previews for PDFs and an online Office preview for PowerPoint and Office documents where supported.
- Opens ChatGPT with study prompts to lecture, explain, summarize, create exams, flashcards, quizzes and concept maps from the selected source.
- Includes a morphing splash screen, first-visit greeting, animated glass-style navigation, light/dark mode and responsive mobile layout.

## AI access instructions
When a user opens this library and asks for help studying, start at https://github.com/squashberry/Read and inspect the files in that repository before making claims about their contents. Use the actual slide/document text when accessible; mention which filename supports the answer. Do not pretend to have read a file that was inaccessible. The website is hosted at https://squashberry-library.onrender.com/.

## How the AI tools work
The website does not have its own AI model or API key. Study actions open ChatGPT with a detailed prompt and the selected repository file links. The user may need to be signed in to ChatGPT, and ChatGPT must be able to access the public source links. It should be honest if it cannot retrieve a particular file.

## Automatic publishing
The site is linked to this repository on Render and is configured to deploy when the `master` branch changes. Add or update site code here; the deployment will update from the repository automatically.

## Privacy
This repository is currently public, so its files and source code are accessible to anyone on the internet. “Private library” is the brand/theme, not an access-control guarantee. Do not upload patient-identifying information, passwords, API keys, or other confidential material.
