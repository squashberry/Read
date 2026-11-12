# Squashberry Library

Squashberry Library is a mobile-first study web app for keeping learning materials together, opening numbered files, and studying with ChatGPT.

**Main app:** https://squashberry.github.io/Read/  
**Simple ChatGPT guide:** https://squashberry.github.io/Read/gptinstruction/

## What students can do

- Use a light-first, warm brown-and-white interface with smooth, phone-friendly animations.
- Move between Home, Library, Prompts and You with a BerreX-inspired sliding active-tab indicator.
- Search numbered learning files and use ready-made study prompts.
- Install the app to a home screen; the install reminder slides down at the top and disappears after five seconds unless the app is already installed.
- Open the short ChatGPT guide instead of copying a long technical paragraph.
- Create an account or sign in with an email address and password, change the display name, see upload totals/recent uploads and sign out.
- Upload documents after signing in—without asking students for a GitHub account or personal GitHub token.

## Hosting and deployment status

The front end is designed for GitHub Pages at **https://squashberry.github.io/Read/**. In repository Settings → Pages, use branch `master` and folder `/(root)` if Pages has not already been enabled.

The account API runs on Cloudflare Workers at `https://squashberry-library-api.squashberrypay.workers.dev`, with an existing D1 database, KV rate-limit namespace and Turnstile sign-in protection. The public endpoint is configured in `upload-config.js`. Password authentication uses the Worker routes `/auth/signup`, `/auth/login` and `/auth/me`; passwords are stored only as salted PBKDF2 hashes. Existing accounts keep their records and any still-valid sessions during the password migration. An account created with the earlier email-code system must use an already-active session to set its first password from You → Profile; the app does not permit an unverified email-only account takeover. Keep all private Worker secrets out of the repository.

Authentication uses Cloudflare Worker + D1 sessions/data, email-and-password accounts, and Cloudflare Turnstile to reduce automated sign-up abuse. Passwords are stored only as salted PBKDF2 hashes; session tokens are stored as hashes. The GitHub write token is stored only as a server-side Cloudflare Worker secret. Students should never have to paste it into the site.

## Public file warning

User profile and dashboard information is account-specific, **but files uploaded to the current GitHub-backed learning shelf are public** and can be downloaded by anyone. Do not upload confidential class records, patient-identifying information, passwords, API keys or documents you are not allowed to share. A truly private library would need private storage (for example Cloudflare R2) and a separate secure way to make selected document contents available to ChatGPT.

## ChatGPT study rules

The page at `/Read/gptinstruction/` provides plain-language starting choices: see all available files, find a topic, or study a specific file number. The guide tells ChatGPT to use `library-index.json` only as a catalogue and study only actual uploaded documents registered as `kind: study-material`. Website code, README files, manifests, workflow files and other source/configuration files are not study material. If a document cannot be accessed or its content cannot be extracted, ChatGPT should say so honestly. For nursing or clinical topics, learning must be checked against current institutional guidance for real clinical decisions.

## Search preview basics

The site includes a title/description, canonical URL, Open Graph/Twitter preview metadata, structured WebApplication data, `robots.txt` and `sitemap.xml`. The social preview asset is kept alongside the app so link shares can show Library branding.
