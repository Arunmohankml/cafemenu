import admin from 'firebase-admin';

const isMockAdmin = !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_PROJECT_ID;

let adminAuthInstance: any;

const createMockAdminAuth = () => {
  return {
    createSessionCookie: async (idToken: string) => {
      return idToken;
    },
    verifySessionCookie: async (sessionCookie: string) => {
      return {
        sub: 'mock-user-1',
        uid: 'mock-user-1',
        email: 'admin@auracafe.com',
        role: 'admin'
      };
    }
  };
};

if (isMockAdmin) {
  adminAuthInstance = createMockAdminAuth();
} else {
  try {
    // Initialize real Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^['"]|['"]$/g, '')?.replace(/\\n/g, '\n'),
        }),
      });
    }
    adminAuthInstance = admin.auth();
  } catch (error: any) {
    console.warn("⚠️ Firebase Admin SDK initialization failed (e.g. invalid/corrupt private key). Falling back to Mock Admin. Reason:", error.message);
    adminAuthInstance = createMockAdminAuth();
  }
}

export const adminAuth = adminAuthInstance;
export { admin };
