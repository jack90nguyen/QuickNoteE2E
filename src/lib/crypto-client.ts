// Helper functions for base64 encoding/decoding array buffers
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate random salt (16 bytes)
export function generateSalt(): string {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return bufferToBase64(salt);
}

// Generate random master key (32 bytes - AES-256)
export function generateMasterKeyBase64(): string {
  const key = window.crypto.getRandomValues(new Uint8Array(32));
  return bufferToBase64(key);
}

// Derive AES-GCM key from password and salt using PBKDF2
export async function deriveKeyFromPassword(password: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKeyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const saltBuffer = base64ToBuffer(saltBase64);

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt master key using derived password key
export async function encryptMasterKey(masterKeyBase64: string, derivedKey: CryptoKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const masterKeyBuffer = base64ToBuffer(masterKeyBase64);
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    derivedKey,
    masterKeyBuffer
  );

  return {
    encryptedMasterKey: bufferToBase64(encrypted),
    masterKeyIv: bufferToBase64(iv),
  };
}

// Decrypt master key using derived password key
export async function decryptMasterKey(encryptedMasterKeyBase64: string, masterKeyIvBase64: string, derivedKey: CryptoKey): Promise<string> {
  const ivBuffer = base64ToBuffer(masterKeyIvBase64);
  const encryptedBuffer = base64ToBuffer(encryptedMasterKeyBase64);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    derivedKey,
    encryptedBuffer
  );

  return bufferToBase64(decrypted);
}

// Helper to get CryptoKey from raw base64 master key for note encryption
async function importMasterKeyForNotes(masterKeyBase64: string): Promise<CryptoKey> {
  const rawKey = base64ToBuffer(masterKeyBase64);
  return window.crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt note content using master key
export async function encryptNoteContent(content: string, masterKeyBase64: string) {
  const key = await importMasterKeyForNotes(masterKeyBase64);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(content)
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
  };
}

// Decrypt note content using master key
export async function decryptNoteContent(ciphertextBase64: string, ivBase64: string, masterKeyBase64: string): Promise<string> {
  const key = await importMasterKeyForNotes(masterKeyBase64);
  const ivBuffer = base64ToBuffer(ivBase64);
  const encryptedBuffer = base64ToBuffer(ciphertextBase64);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    key,
    encryptedBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}