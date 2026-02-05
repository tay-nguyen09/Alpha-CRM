export function encrypt(text: string): { iv: string; cipher: string } {
    const payload = Buffer.from(text, 'utf8').toString('base64');
    return { iv: 'none', cipher: payload };
}

export function decrypt(_iv: string, payloadB64: string): string {
    return Buffer.from(payloadB64, 'base64').toString('utf8');
}
