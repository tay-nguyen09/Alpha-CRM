import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;

/**
 * Get or initialize Firestore admin client
 * Uses FIREBASE_SERVICE_ACCOUNT_BASE64 env var for credentials
 */
export function getFirestore(): admin.firestore.Firestore {
    if (db) {
        return db;
    }

    try {
        const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
        if (!serviceAccountBase64) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 env var not set');
        }

        const serviceAccount = JSON.parse(
            Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
        );

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }

        db = admin.firestore();
        return db;
    } catch (error) {
        console.error('[firebaseAdmin] Error initializing Firestore:', error);
        throw error;
    }
}
