import axios from 'axios'

let cachedPublicKey: string | null = null
let fetchPromise: Promise<string> | null = null

/**
 * Fetches the RSA Public Key from the backend.
 * Caches it in memory so it's only requested once.
 */
export async function getPublicKey(): Promise<string> {
  if (cachedPublicKey) {
    return cachedPublicKey
  }

  if (fetchPromise) {
    return fetchPromise
  }

  const fetchKey = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api'
      const response = await axios.get(`${baseUrl}/encryption/public-key`)
      
      if (response.data?.success && response.data?.data?.publicKey) {
        cachedPublicKey = response.data.data.publicKey
        return cachedPublicKey
      }
      throw new Error('Invalid public key response')
    } catch (error) {
      fetchPromise = null
      throw new Error('Failed to fetch RSA Public Key')
    }
  }

  fetchPromise = fetchKey()
  return fetchPromise
}
