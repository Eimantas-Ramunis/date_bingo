import crypto from 'crypto';

import prisma from '../utils/db.js';

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENC_PREFIX = 'enc:v1';

const getSecret = () => process.env.SESSION_SECRET || 'dev_secret';

const getCipherKey = () => {
  const secret = getSecret();
  return crypto.createHash('sha256').update(`datebingo:${secret}`).digest();
};

const encryptValue = (plainText) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', getCipherKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    ENC_PREFIX,
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64')
  ].join(':');
};

const decryptValue = (storedValue) => {
  if (typeof storedValue !== 'string' || !storedValue.startsWith(`${ENC_PREFIX}:`)) {
    return null;
  }

  const payload = storedValue.slice(`${ENC_PREFIX}:`.length);
  const parts = payload.split(':');
  if (parts.length !== 3) return null;

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = Buffer.from(parts[2], 'base64');

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH || encrypted.length === 0) {
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', getCipherKey(), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    return null;
  }
};

export const getSetting = async (key) => {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  if (!row) return null;
  return decryptValue(row.value);
};

export const setSetting = async (key, value) => {
  const encrypted = encryptValue(value);
  await prisma.appSetting.upsert({
    where: { key },
    update: { value: encrypted },
    create: { key, value: encrypted }
  });
};

export const deleteSetting = async (key) => {
  await prisma.appSetting.deleteMany({ where: { key } });
};
