# GREVocab

A mobile-friendly React app to learn and review 1000 GRE vocabulary words using flashcards and spaced repetition.

## Features

- 1000 GRE words stored in a local JSON file: `src/data/gre-words-1000.json`
- Flashcard-by-flashcard learning mode with:
  - meaning
  - example
  - usage
- Spaced-repetition quiz mode (`Again`, `Hard`, `Good`, `Easy`)
- Progressive Web App (PWA) support:
  - installable on iPhone (Add to Home Screen)
  - offline shell caching via service worker
- Firebase integration:
  - Google Sign-In only
  - progress saved to Firebase Firestore per user
  - all app data scoped under `Tools/GREVocab` in Firestore

## Firebase setup

1. Create a Firebase project.
2. Enable **Google** provider in Firebase Authentication.
3. Enable **Cloud Firestore**.
4. Update `src/firebase/firebaseConfig.json` with your Firebase project values.
5. Optionally set `googleWebClientId` for project metadata/reference in config.

The app uses placeholders by default and will show a setup message until configuration is updated.

### Firestore structure

All user data is written under:

- `Tools` (collection)
  - `GREVocab` (document)
    - `users` (subcollection)
      - `{uid}` (document with `progress`, `user`, `updatedAt`, `scope`)

### Firebase Hosting

This project is configured for Firebase Hosting site:

- `archts-tool-grevocab`

Deploy:

```bash
npm run build
firebase deploy --only hosting:grevocab
```

### iPhone install

1. Open the deployed app in Safari.
2. Tap **Share**.
3. Tap **Add to Home Screen**.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Data sources

Word data was assembled from public GRE vocabulary datasets and normalized into `src/data/gre-words-1000.json`.
