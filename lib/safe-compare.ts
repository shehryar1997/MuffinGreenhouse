// Constant-time string comparison for secrets (passwords, bearer tokens).
// Uses Web Crypto so it works in both the Node and Edge runtimes.
//
// Both inputs are hashed first, so the comparison always runs over two
// fixed-length (32 byte) buffers and leaks neither content nor length.
export async function safeEqual(a: string | null | undefined, b: string | null | undefined): Promise<boolean> {
  if (typeof a !== "string" || typeof b !== "string") return false
  const encoder = new TextEncoder()
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ])
  const viewA = new Uint8Array(hashA)
  const viewB = new Uint8Array(hashB)
  let diff = 0
  for (let i = 0; i < viewA.length; i++) diff |= viewA[i] ^ viewB[i]
  return diff === 0
}
