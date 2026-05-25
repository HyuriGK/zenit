import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function getKey(): Buffer {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error('AUTH_SECRET not configured');
    return createHash('sha256').update(`zenit-senhas:${secret}`).digest();
}

export function encrypt(text: string): string {
    const key = getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decrypt(encryptedText: string): string {
    const key = getKey();
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;
    const [ivB64, authTagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(data).toString('utf8') + decipher.final('utf8');
}
