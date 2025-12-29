import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

export const DotScreenShader = () => {
  const ref = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const cols = 50
    const rows = 30
    const total = cols * rows

    el.innerHTML = ''
    el.style.display = 'grid'
    el.style.gridTemplateColumns = `repeat(${cols}, 1fr)`
    el.style.gridTemplateRows = `repeat(${rows}, 1fr)`
    el.style.gap = '0'
    el.style.width = '100%'
    el.style.height = '100%'
    el.style.position = 'absolute'
    el.style.top = '0'
    el.style.left = '0'
    el.style.zIndex = '-1'
    el.style.pointerEvents = 'none'

    for (let i = 0; i < total; i++) {
      const dot = document.createElement('div')
      const size = Math.random() * 2 + 1
      dot.style.width = `${size}px`
      dot.style.height = `${size}px`
      dot.style.borderRadius = '50%'
      dot.style.background = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'
      dot.style.animation = `fade ${2 + Math.random() * 3}s ease-in-out infinite`
      dot.style.animationDelay = `${Math.random() * 5}s`
      el.appendChild(dot)
    }

    const style = document.createElement('style')
    style.textContent = `
      @keyframes fade {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 0.8; }
      }
    `
    document.head.appendChild(style)

    return () => {
      style.remove()
    }
  }, [theme])

  return <div ref={ref} />
}