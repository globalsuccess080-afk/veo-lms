import { useEffect, useRef } from 'react'
import { useThemeStore } from '../../store/themeStore'

type Props = {
  containerId?: string
  containerRef?: React.RefObject<HTMLElement>
}

export function CustomScrollbar({ containerId, containerRef }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const isContainer = containerId != null || containerRef != null

  const accent = useThemeStore((s) => s.accent)

  function getPrimaryColor(): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--primary')
      .trim()
  }

  useEffect(() => {
    const thumb = thumbRef.current
    if (!thumb) return
    thumb.style.background = getPrimaryColor()
  }, [accent])

  useEffect(() => {
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!track || !thumb) return

    const containerEl =
      containerRef?.current ??
      (containerId ? document.getElementById(containerId) : null)

    const target = containerEl ?? document.documentElement
    const useContainer = Boolean(containerEl)

    function updateThumb(): void {
      const scrollHeight = useContainer
        ? (target as HTMLElement).scrollHeight
        : document.documentElement.scrollHeight
      const clientHeight = useContainer
        ? (target as HTMLElement).clientHeight
        : window.innerHeight

      const scrollable = scrollHeight - clientHeight
      if (scrollable <= 0) {
        thumb!.style.opacity = '0'
        return
      }

      const scrolled = useContainer
        ? (target as HTMLElement).scrollTop / scrollable
        : window.scrollY / scrollable

      const trackH = track!.clientHeight
      const thumbH = Math.max(30, (clientHeight / scrollHeight) * trackH)

      thumb!.style.height = `${thumbH}px`
      thumb!.style.top = `${scrolled * (trackH - thumbH)}px`
      thumb!.style.opacity = '1'
    }

    if (useContainer) {
      ;(target as HTMLElement).addEventListener('scroll', updateThumb)
      window.addEventListener('resize', updateThumb)
    } else {
      window.addEventListener('scroll', updateThumb)
      window.addEventListener('resize', updateThumb)
    }

    const resizeObserver = new ResizeObserver(updateThumb)
    resizeObserver.observe(track)
    resizeObserver.observe(useContainer ? (target as HTMLElement) : document.documentElement)

    const mutationObserver = useContainer
      ? new MutationObserver(updateThumb)
      : null

    if (mutationObserver) {
      mutationObserver.observe(target as HTMLElement, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }

    updateThumb()

    return () => {
      if (useContainer) {
        ;(target as HTMLElement).removeEventListener('scroll', updateThumb)
        window.removeEventListener('resize', updateThumb)
      } else {
        window.removeEventListener('scroll', updateThumb)
        window.removeEventListener('resize', updateThumb)
      }
      resizeObserver.disconnect()
      mutationObserver?.disconnect()
    }
  }, [containerId, containerRef])

  const trackStyle: React.CSSProperties = isContainer
    ? {
        position: 'absolute',
        right: '8px',
        top: '8px',
        bottom: '8px',
        width: '6px',
        borderRadius: '9999px',
        background: 'transparent',
        pointerEvents: 'none',
        zIndex: 9999,
      }
    : {
        position: 'fixed',
        right: '4px',
        top: '4px',
        bottom: '4px',
        width: '4px',
        borderRadius: '9999px',
        background: 'transparent',
        pointerEvents: 'none',
        zIndex: 9999,
      }

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    width: isContainer ? '6px' : '4px',
    borderRadius: '9999px',
    background: getPrimaryColor(),
    opacity: 0,
    transition: 'height 120ms linear, top 120ms linear, opacity 200ms ease',
  }

  return (
    <div ref={trackRef} style={trackStyle}>
      <div ref={thumbRef} style={thumbStyle} />
    </div>
  )
}
