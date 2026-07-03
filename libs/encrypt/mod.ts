// Encryption lib — AES-GCM for encrypting user API keys at rest
// Uses server-side ENCRYPTION_KEY from env (must be 32 hex chars = 16 bytes for AES-128 or 64 hex chars = 32 bytes for AES-256)

const ENCRYPTION_KEY_ENV = "ENCRYPTION_KEY"

function getEncryptionKey(): Uint8Array {
  const hex = Deno.env.get(ENCRYPTION_KEY_ENV)
  if (!hex) {
    throw new Error(
      `${ENCRYPTION_KEY_ENV} env var required. Generate with: deno eval 'console.log([...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,"0")).join(""))'`,
    )
  }
  const bytes = hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16))
  if (!bytes || (bytes.length !== 16 && bytes.length !== 32)) {
    throw new Error(
      `${ENCRYPTION_KEY_ENV} must be 32 hex chars (16 bytes, AES-128) or 64 hex chars (32 bytes, AES-256)`,
    )
  }
  return new Uint8Array(bytes)
}

let _key: CryptoKey | null = null

async function getKey(): Promise<CryptoKey> {
  if (_key) return _key
  const raw = getEncryptionKey()
  _key = await crypto.subtle.importKey(
    "raw",
    raw.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  )
  return _key
}

/**
 * Encrypt a plaintext string.
 * Returns: base64(iv:12bytes + ciphertext + tag:16bytes)
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for GCM
  const encoded = new TextEncoder().encode(plaintext)
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  )
  // Concatenate iv + ciphertext+tag
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt an encrypted string (base64 iv+ciphertext+tag).
 */
export async function decrypt(encoded: string): Promise<string> {
  const key = await getKey()
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  )
  return new TextDecoder().decode(decrypted)
}

/**
 * Get last N characters of a plaintext (for UI hint — never show full key).
 */
export function maskKey(key: string, visible = 4): string {
  if (key.length <= visible) return "*".repeat(key.length)
  return "*".repeat(key.length - visible) + key.slice(-visible)
}
