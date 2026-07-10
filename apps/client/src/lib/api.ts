import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '../store/authStore'
import { getPublicKey } from '../crypto/publicKey.service'
import { createEncryptionSession, encryptPayload, decryptPayload } from '../crypto/encryption'

// Extend Axios request config to store our ephemeral AES session key
interface EncryptedRequestConfig extends InternalAxiosRequestConfig {
  _aesKey?: CryptoKey;
  _retry?: boolean;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true
})

const ENCRYPTABLE_METHODS = ['post', 'put', 'patch', 'delete']
const DEVICE_ID_KEY = 'veolms_device_id'
const PAYLOAD_ENCRYPTION_ENABLED = import.meta.env.VITE_ENABLE_PAYLOAD_ENCRYPTION === undefined
  ? import.meta.env.PROD
  : import.meta.env.VITE_ENABLE_PAYLOAD_ENCRYPTION === 'true'

function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing

  const generated = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  localStorage.setItem(DEVICE_ID_KEY, generated)
  return generated
}

api.interceptors.request.use(async (config: EncryptedRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['x-device-id'] = getDeviceId()

  // If encryption is enabled and it's a modifying request with a JSON body
  if (
    PAYLOAD_ENCRYPTION_ENABLED &&
    config.method && ENCRYPTABLE_METHODS.includes(config.method.toLowerCase()) &&
    config.data && !(config.data instanceof FormData)
  ) {
    try {
      const rsaPublicKey = await getPublicKey()
      const session = await createEncryptionSession(rsaPublicKey)
      
      const payloadString = JSON.stringify(config.data)
      const encryptedData = await encryptPayload(payloadString, session.aesKey)
      
      config.data = {
        encryptedKey: session.encryptedKeyBase64,
        ...encryptedData
      }
      
      // Store the AES key temporarily on the config object for decryption of the response
      config._aesKey = session.aesKey
    } catch (error) {
      console.error('Failed to encrypt request payload:', error)
      return Promise.reject(error)
    }
  }

  return config
})

let refreshing = false
let queue: Array<(token: string) => void> = []

api.interceptors.response.use(
  async (res: AxiosResponse) => {
    const config = res.config as EncryptedRequestConfig

    // If we have an AES key attached, the response is encrypted and we must decrypt it
    if (config._aesKey && res.data && res.data.data && res.data.iv && res.data.tag) {
      try {
        const decryptedString = await decryptPayload(
          res.data.data,
          res.data.iv,
          res.data.tag,
          config._aesKey
        )
        res.data = JSON.parse(decryptedString)
      } catch (error) {
        console.error('Failed to decrypt response payload:', error)
      } finally {
        // Securely destroy the AES key reference
        delete config._aesKey
      }
    }
    
    return res
  },
  async (error) => {
    const original = error.config as EncryptedRequestConfig
    
    // Cleanup AES key if request failed (e.g. 400 error from backend validation)
    if (original && original._aesKey) {
       delete original._aesKey
    }

    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }
      original._retry = true
      refreshing = true
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          {},
          { withCredentials: true, headers: { 'x-device-id': getDeviceId() } }
        )
        const token = data.data.accessToken
        useAuthStore.getState().setToken(token)
        queue.forEach((cb) => cb(token))
        queue = []
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch {
        useAuthStore.getState().logout()
        const currentPath = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/login?redirect=${currentPath}`
        return Promise.reject(error)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
