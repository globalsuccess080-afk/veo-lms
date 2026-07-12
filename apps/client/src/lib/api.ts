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

export function getDeviceId() {
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

  const method = config.method?.toLowerCase()
  const isEncryptableMethod = Boolean(method && ENCRYPTABLE_METHODS.includes(method))
  const isFormData = config.data instanceof FormData

  // If encryption is enabled and it's a modifying request with a JSON body
  if (
    PAYLOAD_ENCRYPTION_ENABLED &&
    isEncryptableMethod &&
    !isFormData
  ) {
    try {
      const rsaPublicKey = await getPublicKey()
      const session = await createEncryptionSession(rsaPublicKey)
      
      const payloadString = JSON.stringify(config.data ?? {})
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

function isAuthEndpoint(url?: string) {
  return Boolean(url && /\/auth\/(login|admin\/login|register|send-otp|forgot-password|reset-password|refresh|logout)(\?|$)/.test(url))
}

function isProtectedPage(path = window.location.pathname) {
  return ['/dashboard', '/my-courses', '/profile', '/admin'].some((prefix) => path.startsWith(prefix))
}

function requestHasAuthHeader(config?: EncryptedRequestConfig) {
  const authHeader = config?.headers?.Authorization || config?.headers?.authorization
  return Boolean(authHeader)
}

function normalizeErrorMessage(error: any) {
  const status = error.response?.status
  const message = error.response?.data?.message
  if (!error.response?.data) return

  if (/failed to decrypt|invalid encrypted payload/i.test(message || '')) {
    error.response.data.message = 'We could not read this request securely. Please refresh the page and try again.'
    return
  }

  if (status >= 500 || !message || /internal server error|^500\b/i.test(message)) {
    error.response.data.message = status >= 500
      ? 'Something went wrong on our side. Please try again in a moment.'
      : 'Please check the details you entered and try again.'
  }
}

async function decryptEncryptedResponse(data: any, aesKey: CryptoKey) {
  if (!data?.data || !data?.iv || !data?.tag) return data

  const decryptedString = await decryptPayload(
    data.data,
    data.iv,
    data.tag,
    aesKey
  )
  return JSON.parse(decryptedString)
}

api.interceptors.response.use(
  async (res: AxiosResponse) => {
    const config = res.config as EncryptedRequestConfig

    // If we have an AES key attached, the response is encrypted and we must decrypt it
    if (config._aesKey && res.data && res.data.data && res.data.iv && res.data.tag) {
      try {
        res.data = await decryptEncryptedResponse(res.data, config._aesKey)
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

    if (original?._aesKey && error.response?.data) {
      try {
        error.response.data = await decryptEncryptedResponse(error.response.data, original._aesKey)
      } catch (decryptError) {
        console.error('Failed to decrypt error response payload:', decryptError)
      }
    }

    normalizeErrorMessage(error)
    
    // Cleanup AES key if request failed (e.g. 400 error from backend validation)
    if (original && original._aesKey) {
       delete original._aesKey
    }

    const shouldRecoverAuth = Boolean(useAuthStore.getState().accessToken || requestHasAuthHeader(original) || isProtectedPage())

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint(original.url) && shouldRecoverAuth) {
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
        const { data } = await api.post('/auth/refresh', {})
        const token = data.data.accessToken
        useAuthStore.getState().setToken(token)
        queue.forEach((cb) => cb(token))
        queue = []
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch {
        useAuthStore.getState().logout()
        if (isProtectedPage() && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/admin/login')) {
          const currentPath = encodeURIComponent(window.location.pathname + window.location.search)
          window.location.href = `/login?redirect=${currentPath}`
        }
        return Promise.reject(error)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
