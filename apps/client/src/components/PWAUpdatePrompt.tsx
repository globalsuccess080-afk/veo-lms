import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

export function PWAUpdatePrompt() {
  const [refreshing, setRefreshing] = useState(false)
  const [updateReady, setUpdateReady] = useState(false)
  const [updateServiceWorker, setUpdateServiceWorker] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setUpdateReady(true)
      },
      onOfflineReady() {
        setUpdateReady(false)
      }
    })

    setUpdateServiceWorker(() => updateSW)
  }, [])

  if (!updateReady) return null

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
