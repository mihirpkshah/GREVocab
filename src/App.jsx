import { useEffect, useMemo, useState } from 'react'
import wordsData from './data/gre-words-1000.json'
import {
  auth,
  database,
  provider,
  isConfigured,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  ref,
  get,
  set,
} from './firebase/firebase'
import './App.css'

const MS_PER_DAY = 24 * 60 * 60 * 1000

const defaultReviewState = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  dueAt: 0,
  attempts: 0,
  correct: 0,
}

function nextReviewState(previous = defaultReviewState, quality, now = Date.now()) {
  const prior = { ...defaultReviewState, ...previous }
  const q = Math.max(0, Math.min(5, quality))

  let repetitions = prior.repetitions
  let intervalDays = prior.intervalDays
  let easeFactor = prior.easeFactor

  if (q < 3) {
    repetitions = 0
    intervalDays = 1
  } else {
    repetitions += 1
    if (repetitions === 1) {
      intervalDays = 1
    } else if (repetitions === 2) {
      intervalDays = 3
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * easeFactor))
    }
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  )

  return {
    easeFactor,
    intervalDays,
    repetitions,
    dueAt: now + intervalDays * MS_PER_DAY,
    attempts: prior.attempts + 1,
    correct: prior.correct + (q >= 3 ? 1 : 0),
  }
}

function App() {
  const allWords = wordsData.words
  const [mode, setMode] = useState('learn')
  const [learnIndex, setLearnIndex] = useState(0)
  const [quizWordIndex, setQuizWordIndex] = useState(0)
  const [showQuizAnswer, setShowQuizAnswer] = useState(false)
  const [progress, setProgress] = useState({})
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(isConfigured)

  const dueWords = useMemo(() => {
    const now = Date.now()
    return allWords.filter((word) => {
      const state = progress[word.word]
      return !state || !state.dueAt || state.dueAt <= now
    })
  }, [allWords, progress])

  const currentLearnWord = allWords[learnIndex]
  const currentQuizWord = dueWords[quizWordIndex] || null

  const reviewedCount = useMemo(
    () => Object.keys(progress).filter((word) => progress[word]?.attempts > 0).length,
    [progress],
  )

  async function loadProgress(uid) {
    if (!database) return
    const snapshot = await get(ref(database, `users/${uid}/progress`))
    setProgress(snapshot.exists() ? snapshot.val() : {})
  }

  async function persistProgress(uid, nextProgress) {
    if (!database || !uid) return
    await set(ref(database, `users/${uid}/progress`), nextProgress)
  }

  async function handleSignIn() {
    if (!auth) return
    await signInWithPopup(auth, provider)
  }

  async function handleSignOut() {
    if (!auth) return
    await signOut(auth)
    setProgress({})
    setQuizWordIndex(0)
  }

  function handleGrade(quality) {
    if (!currentQuizWord) return
    const nextState = nextReviewState(progress[currentQuizWord.word], quality)
    const nextProgress = {
      ...progress,
      [currentQuizWord.word]: nextState,
    }

    setProgress(nextProgress)
    setShowQuizAnswer(false)

    if (user?.uid) {
      persistProgress(user.uid, nextProgress)
    }
  }

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (signedInUser) => {
      setUser(signedInUser)
      setAuthLoading(false)
      if (signedInUser?.uid) {
        await loadProgress(signedInUser.uid)
      }
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (quizWordIndex >= dueWords.length) {
      setQuizWordIndex(0)
    }
  }, [dueWords.length, quizWordIndex])

  return (
    <main className="app">
      <header className="app-header">
        <h1>GRE Vocabulary Flashcards</h1>
        <p>
          Learn 1000 high-frequency GRE words with spaced repetition and track your
          progress.
        </p>
        <div className="auth-area">
          {isConfigured ? (
            user ? (
              <>
                <span className="user-text">Signed in as {user.displayName}</span>
                <button type="button" onClick={handleSignOut}>
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={authLoading}
              >
                Sign in with Google
              </button>
            )
          ) : (
            <p className="hint">
              Add Firebase values in <code>src/firebase/firebaseConfig.json</code> to
              enable Google sign-in and cloud progress sync.
            </p>
          )}
        </div>
      </header>

      <section className="stats">
        <p>Total words: {allWords.length}</p>
        <p>Reviewed words: {reviewedCount}</p>
        <p>Due now: {dueWords.length}</p>
      </section>

      <section className="mode-switch">
        <button
          type="button"
          className={mode === 'learn' ? 'active' : ''}
          onClick={() => setMode('learn')}
        >
          Learn
        </button>
        <button
          type="button"
          className={mode === 'quiz' ? 'active' : ''}
          onClick={() => setMode('quiz')}
        >
          Spaced-Repetition Quiz
        </button>
      </section>

      {mode === 'learn' ? (
        <section className="card-area">
          <article className="card">
            <p className="meta">
              Card {learnIndex + 1} / {allWords.length}
            </p>
            <h2>{currentLearnWord.word}</h2>
            <p>
              <strong>Meaning:</strong> {currentLearnWord.meaning}
            </p>
            <p>
              <strong>Example:</strong> {currentLearnWord.example}
            </p>
            <p>
              <strong>Usage:</strong> {currentLearnWord.usage}
            </p>
          </article>
          <div className="row-buttons">
            <button
              type="button"
              onClick={() => setLearnIndex((idx) => Math.max(0, idx - 1))}
              disabled={learnIndex === 0}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setLearnIndex((idx) => Math.min(allWords.length - 1, idx + 1))
              }
              disabled={learnIndex === allWords.length - 1}
            >
              Next
            </button>
          </div>
        </section>
      ) : (
        <section className="card-area">
          {currentQuizWord ? (
            <>
              <article className="card">
                <p className="meta">
                  Due card {quizWordIndex + 1} / {dueWords.length}
                </p>
                <h2>{currentQuizWord.word}</h2>
                {showQuizAnswer ? (
                  <>
                    <p>
                      <strong>Meaning:</strong> {currentQuizWord.meaning}
                    </p>
                    <p>
                      <strong>Example:</strong> {currentQuizWord.example}
                    </p>
                    <p>
                      <strong>Usage:</strong> {currentQuizWord.usage}
                    </p>
                  </>
                ) : (
                  <p className="hint">Try recalling meaning, example, and usage first.</p>
                )}
              </article>

              {showQuizAnswer ? (
                <div className="grade-buttons">
                  <button type="button" onClick={() => handleGrade(0)}>
                    Again
                  </button>
                  <button type="button" onClick={() => handleGrade(3)}>
                    Hard
                  </button>
                  <button type="button" onClick={() => handleGrade(4)}>
                    Good
                  </button>
                  <button type="button" onClick={() => handleGrade(5)}>
                    Easy
                  </button>
                </div>
              ) : (
                <div className="row-buttons">
                  <button type="button" onClick={() => setShowQuizAnswer(true)}>
                    Show answer
                  </button>
                </div>
              )}

              <div className="row-buttons">
                <button
                  type="button"
                  onClick={() => setQuizWordIndex((idx) => Math.max(0, idx - 1))}
                  disabled={quizWordIndex === 0}
                >
                  Previous due card
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQuizWordIndex((idx) =>
                      Math.min(Math.max(dueWords.length - 1, 0), idx + 1),
                    )
                  }
                  disabled={quizWordIndex >= dueWords.length - 1}
                >
                  Next due card
                </button>
              </div>
            </>
          ) : (
            <article className="card">
              <h2>All caught up 🎉</h2>
              <p>No cards are due right now. Come back later for the next review.</p>
            </article>
          )}
        </section>
      )}
    </main>
  )
}

export default App
