import admin from 'firebase-admin';

const isMockAdmin = !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_PROJECT_ID;

let adminAuthInstance: any;

if (isMockAdmin) {
  // Mock Firebase Admin Auth implementation for local testing
  adminAuthInstance = {
    createSessionCookie: async (idToken: string) => {
      // Just pass the idToken through as the session cookie
      return idToken;
    },
    verifySessionCookie: async (sessionCookie: string) => {
      // Return a basic mock decoded claims object
      return {
        sub: 'mock-user-1',
        uid: 'mock-user-1',
        email: 'admin@auracafe.com',
        role: 'admin'
      };
    }
  };
} else {
  // Initialize real Firebase Admin SDK
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  adminAuthInstance = admin.auth();
}

export const adminAuth = adminAuthInstance;
export { admin };
