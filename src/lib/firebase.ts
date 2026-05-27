import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword as realSignInWithEmail, signInWithPopup as realSignInWithPopup, signOut as realSignOut } from "firebase/auth";

let isMockFirebase = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
                        process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes('placeholder') || 
                        process.env.NEXT_PUBLIC_FIREBASE_API_KEY === '';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'mock-api-key-value-here',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mock-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mock-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mock-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

// Only initialize real Firebase if not in mock mode to avoid validation errors
let app: any = null;
let realAuth: any = null;
let realGoogleProvider: any = null;

if (!isMockFirebase) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    realAuth = getAuth(app);
    realGoogleProvider = new GoogleAuthProvider();
  } catch (error: any) {
    console.warn("⚠️ Firebase Client SDK initialization failed. Falling back to Mock Auth. Reason:", error.message);
    isMockFirebase = true;
  }
}

// Safe base64 encoding for JWT generation in both Browser & Node/Edge environments
const safeBtoa = (str: string) => {
  if (typeof window !== 'undefined') return window.btoa(str);
  return Buffer.from(str).toString('base64');
};

const generateMockJwt = (userId: string, email: string) => {
  const header = safeBtoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = safeBtoa(JSON.stringify({
    sub: userId,
    user_id: userId,
    email: email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 5 // 5 days
  }));
  return `${header}.${payload}.mock-signature`;
};

class MockAuth {
  private listeners: Array<(user: any) => void> = [];
  private currentUserObj: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mock_auth_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.currentUserObj = this.createUserInstance(parsed.uid, parsed.email, parsed.displayName);
        } catch (e) {
          this.currentUserObj = null;
        }
      }
    }
  }

  private createUserInstance(uid: string, email: string, displayName: string) {
    return {
      uid,
      email,
      displayName,
      photoURL: null,
      getIdToken: async () => generateMockJwt(uid, email)
    };
  }

  get currentUser() {
    return this.currentUserObj;
  }

  onAuthStateChanged(callback: (user: any) => void) {
    this.listeners.push(callback);
    callback(this.currentUserObj);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  async mockLogin(email: string) {
    const isLocalAdmin = email.toLowerCase().includes('admin');
    const uid = isLocalAdmin ? 'mock-user-1' : 'mock-user-2';
    const displayName = isLocalAdmin ? 'Admin User' : 'Staff User';
    const mockEmail = isLocalAdmin ? 'admin@auracafe.com' : 'staff@auracafe.com';

    const userObj = this.createUserInstance(uid, mockEmail, displayName);
    this.currentUserObj = userObj;

    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_auth_user', JSON.stringify({ uid, email: mockEmail, displayName }));
      window.dispatchEvent(new Event('storage'));
    }

    this.listeners.forEach(listener => listener(this.currentUserObj));
    return { user: userObj };
  }

  mockLogout() {
    this.currentUserObj = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_auth_user');
      window.dispatchEvent(new Event('storage'));
    }
    this.listeners.forEach(listener => listener(null));
  }
}

const mockAuthInstance = new MockAuth();

// ============================================================================
// EXPORTS RESOLUTION
// ============================================================================

export const auth = isMockFirebase ? (mockAuthInstance as any) : realAuth;

export const signInWithEmailAndPassword = async (authObj: any, email: string, password?: string) => {
  if (isMockFirebase) {
    return mockAuthInstance.mockLogin(email);
  }
  return realSignInWithEmail(authObj, email, password || '');
};

export const signInWithPopup = async (authObj: any, provider?: any) => {
  if (isMockFirebase) {
    return mockAuthInstance.mockLogin('admin@auracafe.com');
  }
  return realSignInWithPopup(authObj, provider);
};

export const signOut = async (authObj: any) => {
  if (isMockFirebase) {
    mockAuthInstance.mockLogout();
    return;
  }
  return realSignOut(authObj);
};

export const googleProvider = isMockFirebase ? ({} as any) : realGoogleProvider;

export {
  app
};
