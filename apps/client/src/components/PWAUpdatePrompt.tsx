import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { PWA_UPDATE_MODE } from '@/config/pwaUpdateMode'

const HARD_UPDATE_CACHES = ['veolms-html', 'veolms-js', 'veolms-css', 'veolms-manifest', 'veolms-public-api']

async function clearStaleAppCaches() {
  if (!('caches' in window)) return

  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.filter((cacheName) => HARD_UPDATE_CACHES.includes(cacheName)).map((cacheName) => caches.delete(cacheName)))
}

export function PWAUpdatePrompt() {
  const [refreshing, setRefreshing] = useState(false)
  const [updateReady, setUpdateReady] = useState(false)
  const [updateServiceWorker, setUpdateServiceWorker] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    let applyingUpdate = false
    let updateCheckInterval: number | undefined
    let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined

    const applyUpdate = async () => {
      if (applyingUpdate) return

      applyingUpdate = true
      setRefreshing(true)
      await clearStaleAppCaches().catch(() => undefined)
      await updateServiceWorker?.(true)
    }

    updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        if (PWA_UPDATE_MODE === 'auto') {
          void applyUpdate()
          return
        }

        setUpdateReady(true)
      },
      onOfflineReady() {
        setUpdateReady(false)
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return

        void registration.update().catch(() => undefined)
        updateCheckInterval = window.setInterval(() => {
          void registration.update().catch(() => undefined)
        }, 30 * 60 * 1000)
      }
    })

    setUpdateServiceWorker(() => updateServiceWorker ?? null)

    return () => {
      if (updateCheckInterval) window.clearInterval(updateCheckInterval)
    }
  }, [])

  if (PWA_UPDATE_MODE === 'auto' || !updateReady) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-line bg-surface p-4 shadow-xl">
      <p className="text-sm font-bold text-fg">Update available</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">A newer version of VeoLMS is ready. Reload when convenient to use the latest app.</p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setUpdateReady(false)}
          className="rounded-lg px-3 py-1.5 text-xs font-bold text-muted hover:bg-surface2 hover:text-fg"
        >
          Later
        </button>
        <button
          type="button"
          disabled={refreshing}
          onClick={async () => {
            setRefreshing(true)
            await clearStaleAppCaches().catch(() => undefined)
            await updateServiceWorker?.(true)
          }}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-fg disabled:opacity-60"
        >
          {refreshing ? 'Reloading...' : 'Reload'}
        </button>
      </div>
    </div>
  )
}
