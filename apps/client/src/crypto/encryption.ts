/**
 * Web Crypto API utilities for Hybrid RSA + AES-256-GCM encryption.
 */

// Utility to convert a base64 string to an ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

// Utility to convert an ArrayBuffer to a base64 string
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  let binary = ''
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

// Strip PEM headers and return ArrayBuffer for import
function convertPemToArrayBuffer(pem: string): ArrayBuffer {
  const b64Lines = pem.replace(/(-----(BEGIN|END) PUBLIC KEY-----|\n|\r)/g, '')
  return base64ToArrayBuffer(b64Lines)
}

/**
 * Imports an RSA Public Key (PEM) for encryption.
 */
async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  const binaryDer = convertPemToArrayBuffer(pem)
  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['encrypt']
  )
}

export interface EncryptionSession {
  aesKey: CryptoKey;
  encryptedKeyBase64: string; // The RSA-encrypted AES key to send to backend
}

/**
 * Generates a random AES-256-GCM session key and encrypts it with the backend's RSA Public Key.
 */
export async function createEncryptionSession(rsaPublicKeyPem: string): Promise<EncryptionSession> {
  // Generate random AES key
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  )

  // Export AES key to raw bytes
  const exportedAesKey = await window.crypto.subtle.exportKey('raw', aesKey)

  // Import RSA public key
  const rsaPubKey = await importRsaPublicKey(rsaPublicKeyPem)

  // Encrypt the raw AES key with the RSA public key
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    rsaPubKey,
    exportedAesKey
  )

  return {
    aesKey,
    encryptedKeyBase64: arrayBufferToBase64(encryptedAesKey)
  }
}

export interface EncryptedPayload {
  encryptedKey?: string;
  data: string;
  iv: string;
  tag: string;
}

/**
 * Encrypts a payload string using the provided AES-256-GCM session key.
 */
export async function encryptPayload(payload: string, aesKey: CryptoKey): Promise<Omit<EncryptedPayload, 'encryptedKey'>> {
  const encoder = new TextEncoder()
  const data = encoder.encode(payload)
  
  // AES-GCM requires a 12-byte IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12))

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    aesKey,
    data
  )

  // WebCrypto AES-GCM appends the 16-byte authentication tag to the ciphertext
  const ciphertextLength = encryptedBuffer.byteLength - 16
  const ciphertext = encryptedBuffer.slice(0, ciphertextLength)
  const authTag = encryptedBuffer.slice(ciphertextLength)

  return {
    data: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    tag: arrayBufferToBase64(authTag)
  }
}

/**
 * Decrypts a payload string from the backend using the active AES-256-GCM session key.
 */
export async function decryptPayload(
  encryptedDataBase64: string,
  ivBase64: string,
  authTagBase64: string,
  aesKey: CryptoKey
): Promise<string> {
  const ciphertext = base64ToArrayBuffer(encryptedDataBase64)
  const iv = base64ToArrayBuffer(ivBase64)
  const authTag = base64ToArrayBuffer(authTagBase64)

  // WebCrypto expects the ciphertext and auth tag to be concatenated
  const combinedBuffer = new Uint8Array(ciphertext.byteLength + authTag.byteLength)
  combinedBuffer.set(new Uint8Array(ciphertext), 0)
  combinedBuffer.set(new Uint8Array(authTag), ciphertext.byteLength)

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv)
    },
    aesKey,
    combinedBuffer
  )

  const decoder = new TextDecoder()
  return decoder.decode(decryptedBuffer)
}
