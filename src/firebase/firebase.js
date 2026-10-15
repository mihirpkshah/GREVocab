import { initializeApp } from '@firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from '@firebase/auth'
import { getFirestore, doc, getDoc, setDoc } from '@firebase/firestore'
import firebaseConfig from './firebaseConfig.json'

const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
]

const isConfigured = requiredKeys.every((key) => {
  const value = firebaseConfig[key]
  return value && !value.includes('YOUR_')
})

const app = isConfigured ? initializeApp(firebaseConfig) : null
const auth = app ? getAuth(app) : null
const firestore = app ? getFirestore(app) : null
const provider = new GoogleAuthProvider()

provider.setCustomParameters({
  prompt: 'select_account',
})

if (firebaseConfig.googleWebClientId && !firebaseConfig.googleWebClientId.includes('YOUR_')) {
  provider.setCustomParameters({
    prompt: 'select_account',
    client_id: firebaseConfig.googleWebClientId,
  })
}

function getUserProgressDoc(uid) {
  if (!firestore || !uid) return null
  return doc(firestore, 'Tools', 'GREVocab', 'users', uid)
}

async function loadUserProgress(uid) {
  const userDoc = getUserProgressDoc(uid)
  if (!userDoc) return {}
  const snapshot = await getDoc(userDoc)
  if (!snapshot.exists()) return {}
  const data = snapshot.data()
  return data.progress && typeof data.progress === 'object' ? data.progress : {}
}

async function saveUserProgress(uid, progress, userProfile = {}) {
  const userDoc = getUserProgressDoc(uid)
  if (!userDoc) return
  await setDoc(
    userDoc,
    {
      progress,
      scope: 'Tools/GREVocab',
      user: {
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
      },
      updatedAt: Date.now(),
    },
    { merge: true },
  )
}

export {
  auth,
  firestore,
  provider,
  isConfigured,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  loadUserProgress,
  saveUserProgress,
}
