import { initializeApp } from '@firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from '@firebase/auth'
import { getDatabase, ref, get, set } from '@firebase/database'
import firebaseConfig from './firebaseConfig.json'

const requiredKeys = [
  'apiKey',
  'authDomain',
  'databaseURL',
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
const database = app ? getDatabase(app) : null
const provider = new GoogleAuthProvider()

export { auth, database, provider, isConfigured, signInWithPopup, signOut, onAuthStateChanged, ref, get, set }
