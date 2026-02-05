import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-bytes-!!!';
const ALGORITHM = 'aes-256-gcm';

// Ensure key is 32 bytes
const getEncryptionKey = (): Buffer => {
    const key = ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32);
    return Buffer.from(key);
};

/**
 * Encrypts sensitive data like access tokens
 * Returns cipher text and IV needed for decryption
 */
export function encrypt(text: string): { cipher: string; iv: string; authTag: string } {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        return {
            cipher: encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    } catch (error) {
        console.error('[encrypt] Error encrypting data:', error);
        throw new Error('Encryption failed');
    }
}

/**
 * Decrypts encrypted token data
 * Requires the IV and optionally the auth tag for verification
 */
export function decrypt(iv: string, encryptedText: string, authTag?: string): string {
    try {
        const ivBuffer = Buffer.from(iv, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), ivBuffer);

        if (!authTag) {
            console.warn('[decrypt] No authTag provided - token was encrypted without authTag and cannot be decrypted with GCM mode');
            throw new Error('Token missing authTag - re-authentication required');
        }

        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('[decrypt] Error decrypting data:', error);
        throw new Error('Decryption failed');
    }
}
