import { initializeApp } from "firebase/app";
import { Firestore, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_APIKEY,
    authDomain: process.env.NEXT_PUBLIC_AUTHDOMAIN,
    projectId: process.env.NEXT_PUBLIC_PROJECTID,
    storageBucket: process.env.NEXT_PUBLIC_STORAGEBUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_MESSAGINGSENDERID,
    appId: process.env.NEXT_PUBLIC_APPID,
};

const firestoreCache = new Map<string, unknown>();


const app = initializeApp(firebaseConfig);


export let firebaseFireStore: Firestore = getFirestore(app, "blank");
export const firebaseAuth = getAuth(app);
export function getFirestoreByDatabaseId(databaseId?: string) {
    const dbId = databaseId || "(default)";

    if (firestoreCache.has(dbId)) {
        return firestoreCache.get(dbId) as Firestore;
    }

    const db =
        dbId === "(default)"
            ? getFirestore(app)
            : getFirestore(app, dbId);

    firestoreCache.set(dbId, db);
    return db as Firestore;
}

export function initFirestore(databaseId?: string) {
    firebaseFireStore = getFirestoreByDatabaseId(databaseId);
}

export function getFirestoreInstance() {
    if (!firebaseFireStore) {
        throw new Error("Firestore not initialized");
    }
    return firebaseFireStore;
}
