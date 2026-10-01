"use client";

import { useEffect, useRef, type CSSProperties } from "react"

interface SectionSnapProps {
    sections: string
    freeAfter: string
    duration: number
    easing: "Silk" | "Sine" | "Quart"
    enabled: boolean
    keyboard: boolean
    style?: CSSProperties
}

// Visible element for an id (Framer may keep hidden breakpoint copies in the DOM)
function findSection(id: string): HTMLElement | null {
    const list = document.querySelectorAll<HTMLElement>(
        `[id="${CSS.escape(id)}"]`
    )
    for (const el of Array.from(list)) if (el.getClientRects().length) return el
    return null
}

const docTop = (el: HTMLElement) =>
    el.getBoundingClientRect().top + window.scrollY

const EASES: Record<string, (t: number) => number> = {
    // gentle start, long buttery settle
    Silk: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    // softest, almost linear middle
    Sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    // punchier
    Quart: (t) =>
        t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
}
// Silk blended with Sine: no hard acceleration, very soft landing
const silkSine = (t: number) => EASES.Silk(t) * 0.55 + EASES.Sine(t) * 0.45

export default function SectionSnap(props: SectionSnapProps) {
    const {
        sections = "top, manifesto, countdown",
        freeAfter = "footer",
        duration = 1.4,
        easing = "Silk",
        enabled = true,
        keyboard = true,
        style,
    } = props
    const live = useRef(props)
    live.current = props

    useEffect(() => {
        if (!enabled || typeof window === "undefined") return
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
            return

        let raf = 0
        let animating = false
        let lockUntil = 0 // swallow trackpad inertia after an animation
        let lastWheel = 0

        const points = () => {
            const ids = sections
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            const tops: number[] = []
            for (const id of ids) {
                const el = findSection(id)
                if (el) tops.push(Math.round(docTop(el)))
            }
            const free = freeAfter.trim() ? findSection(freeAfter.trim()) : null
            const freeTop = free
                ? Math.round(docTop(free))
                : document.documentElement.scrollHeight
            tops.sort((a, b) => a - b)
            return { tops, freeTop }
        }

        const animateTo = (target: number) => {
            const max =
                document.documentElement.scrollHeight - window.innerHeight
            const to = Math.max(0, Math.min(max, target))
            const from = window.scrollY
            if (Math.abs(to - from) < 2) return false
            cancelAnimationFrame(raf)
            animating = true
            const ms = Math.max(200, duration * 1000)
            const ease =
                easing === "Silk" ? silkSine : EASES[easing] || silkSine
            const t0 = performance.now()
            const html = document.documentElement
            const prev = html.style.scrollBehavior
            html.style.scrollBehavior = "auto"
            const tick = (now: number) => {
                const t = Math.min(1, (now - t0) / ms)
                window.scrollTo(0, from + (to - from) * ease(t))
                if (t < 1) raf = requestAnimationFrame(tick)
                else {
                    animating = false
                    html.style.scrollBehavior = prev
                    lockUntil = performance.now() + 200
                }
            }
            raf = requestAnimationFrame(tick)
            return true
        }

        // returns the snap target for a direction, or null for native scrolling
        const targetFor = (dir: number, delta: number): number | null => {
            const { tops, freeTop } = points()
            if (!tops.length) return null
            const y = window.scrollY
            const eps = 4
            if (y >= freeTop - eps) {
                // inside the free (footer) zone: native, except crossing back up
                if (dir < 0 && y + delta <= freeTop + eps) {
                    return y > freeTop + eps ? freeTop : tops[tops.length - 1]
                }
                return null
            }
            const stops = [...tops, freeTop]
            if (dir > 0) {
                for (const s of stops) if (s > y + eps) return s
                return null
            }
            for (let i = stops.length - 1; i >= 0; i--)
                if (stops[i] < y - eps) return stops[i]
            return 0
        }

        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
            // let inner scroll areas (menus, overlays) scroll themselves
            const tgt = e.target as HTMLElement | null
            if (tgt?.closest?.("[data-snap-ignore]")) return
            const now = performance.now()
            const gap = now - lastWheel
            lastWheel = now
            const dir = Math.sign(e.deltaY)
            if (!dir) return
            if (animating) {
                e.preventDefault()
                return
            }
            // trackpad inertia tail right after a snap: swallow until it pauses
            if (now < lockUntil || (gap < 60 && now - lockUntil < 700)) {
                const t = targetFor(dir, e.deltaY)
                if (t !== null) {
                    e.preventDefault()
                    lockUntil = now + 120
                }
                return
            }
            const t = targetFor(dir, e.deltaY)
            if (t === null) return
            e.preventDefault()
            animateTo(t)
        }

        const onKey = (e: KeyboardEvent) => {
            if (!live.current.keyboard) return
            const el = e.target as HTMLElement | null
            if (
                el &&
                (el.isContentEditable ||
                    /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
            )
                return
            let dir = 0
            if (
                ["ArrowDown", "PageDown"].includes(e.key) ||
                (e.key === " " && !e.shiftKey)
            )
                dir = 1
            if (
                ["ArrowUp", "PageUp"].includes(e.key) ||
                (e.key === " " && e.shiftKey)
            )
                dir = -1
            if (!dir) return
            if (animating) {
                e.preventDefault()
                return
            }
            const t = targetFor(dir, dir * 120)
            if (t === null) return
            e.preventDefault()
            animateTo(t)
        }

        const cancel = () => {
            if (!animating) return
            cancelAnimationFrame(raf)
            animating = false
        }

        window.addEventListener("wheel", onWheel, { passive: false })
        window.addEventListener("keydown", onKey)
        window.addEventListener("pointerdown", cancel)
        window.addEventListener("touchstart", cancel, { passive: true })
        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("wheel", onWheel)
            window.removeEventListener("keydown", onKey)
            window.removeEventListener("pointerdown", cancel)
            window.removeEventListener("touchstart", cancel)
        }
    }, [enabled, sections, freeAfter, duration, easing])

    return (
        <div
            style={{ ...style, pointerEvents: "none" }}
            aria-hidden="true"
        />
    )
}