import admin from 'firebase-admin';
import * as fs from 'fs';

let app: admin.app.App | undefined;

function init() {
    if (admin.apps.length) {
        app = admin.app();
        return app;
    }

    // Prefer base64 env; fall back to file path for local convenience
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    let creds: admin.ServiceAccount;
    if (base64) {
        const json = Buffer.from(base64, 'base64').toString('utf-8');
        creds = JSON.parse(json);
    } else if (path) {
        const json = fs.readFileSync(path, 'utf-8');
        creds = JSON.parse(json);
    } else {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 missing (or set FIREBASE_SERVICE_ACCOUNT_PATH)');
    }

    app = admin.initializeApp({
        credential: admin.credential.cert(creds)
    });
    return app!;
}

export function getFirestore() {
    const a = app ?? init();
    return admin.firestore(a);
}

export function getAuth() {
    const a = app ?? init();
    return admin.auth(a);
}
