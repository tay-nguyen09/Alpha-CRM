// Centralized Firebase client config for the frontend
// Values are read from public env vars so this can run on the client.
export const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_APIKEY || '',
    authDomain: process.env.NEXT_PUBLIC_AUTHDOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_PROJECTID || '',
    storageBucket: process.env.NEXT_PUBLIC_STORAGEBUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_MESSAGINGSENDERID || '',
    appId: process.env.NEXT_PUBLIC_APPID || ''
};
