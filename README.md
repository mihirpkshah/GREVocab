# GREVocab

A mobile-friendly React app to learn and review 1000 GRE vocabulary words using flashcards and spaced repetition.

## Features

- 1000 GRE words stored in a local JSON file: `src/data/gre-words-1000.json`
- Flashcard-by-flashcard learning mode with:
  - meaning
  - example
  - usage
- Spaced-repetition quiz mode (`Again`, `Hard`, `Good`, `Easy`)
- Firebase integration:
  - Google Sign-In only
  - progress saved to Firebase Realtime Database per user

## Firebase setup

1. Create a Firebase project.
2. Enable **Google** provider in Firebase Authentication.
3. Enable **Realtime Database**.
4. Update `src/firebase/firebaseConfig.json` with your Firebase project values.

The app uses placeholders by default and will show a setup message until configuration is updated.

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
