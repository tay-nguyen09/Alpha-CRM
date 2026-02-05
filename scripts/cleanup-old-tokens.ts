/**
 * Script to clean up old tokens that were encrypted without authTag
 * These tokens cannot be decrypted with AES-256-GCM and need to be removed
 * 
 * Run with: npx tsx scripts/cleanup-old-tokens.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!serviceAccountBase64) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_BASE64 not found in environment');
    process.exit(1);
}

const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
);

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function cleanupOldTokens() {
    console.log('🔍 Scanning for pages with tokens missing authTag...\n');

    const pagesSnapshot = await db.collection('pages').get();
    let totalPages = 0;
    let tokensWithoutAuthTag = 0;
    const tokensFixed = 0;

    for (const doc of pagesSnapshot.docs) {
        totalPages++;
        const data = doc.data();
        const pageId = doc.id;

        if (data.accessTokenEncrypted && data.accessTokenIv) {
            if (!data.accessTokenAuthTag) {
                tokensWithoutAuthTag++;
                console.log(`⚠️  Page ${pageId} (${data.pageName || 'Unknown'}) has token without authTag`);

                // Option 1: Delete the encrypted token fields (requires re-authentication)
                // Uncomment the following lines to actually delete:
                /*
                await doc.ref.update({
                    accessTokenEncrypted: null,
                    accessTokenIv: null,
                    // Keep other fields like pageName, pageId, etc.
                });
                tokensFixed++;
                console.log(`   ✓ Cleared invalid token for page ${pageId}`);
                */

                console.log(`   → User needs to re-authenticate this page via OAuth\n`);
            } else {
                console.log(`✓ Page ${pageId} (${data.pageName || 'Unknown'}) has valid token with authTag`);
            }
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total pages: ${totalPages}`);
    console.log(`   Tokens without authTag: ${tokensWithoutAuthTag}`);
    console.log(`   Tokens cleared: ${tokensFixed}`);

    if (tokensWithoutAuthTag > 0) {
        console.log('\n💡 To fix these tokens:');
        console.log('   1. Uncomment the deletion code in this script and run again');
        console.log('   2. Users must re-authenticate via /meta/oauth route');
        console.log('   3. New tokens will include authTag for proper encryption\n');
    } else {
        console.log('\n✅ All tokens are valid!\n');
    }
}

cleanupOldTokens()
    .then(() => {
        console.log('✓ Script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
