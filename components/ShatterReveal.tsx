// Shatter Reveal — Facette hero component (Framer code component)
// Your launch image floats as an exploded field of glass shards.
// The cursor pulls nearby pieces home, the picture assembles as launch day
// approaches, a click sends a shockwave, and a form submit snaps it whole.
// © Facette template. Single file, no dependencies beyond React + Framer.

import * as React from "react"
import { useEffect, useRef } from "react"

type Props = {
    image?: { src: string; alt?: string } | string
    background: string
    shards: number
    posterWidth: number
    ratio: "Image" | "4:5" | "3:4" | "1:1" | "16:10" | "16:9"
    radius: number
    spread: number
    progressMode: "Manual" | "Countdown"
    progress: number
    startDate: string
    launchDate: string
    magnet: number
    cursorRadius: number
    float: number
    edges: boolean
    shadows: boolean
    revealOn: "Submit" | "Click" | "Never"
    clickBurst: boolean
    revealed: boolean
    hoverCursor: boolean
    cursorLabel: string
    style?: React.CSSProperties
}

type Pt = [number, number]
type Shard = {
    poly: Pt[]
    cx: number
    cy: number // home centroid (poster space px)
    bx: number
    by: number
    bw: number
    bh: number
    img: HTMLCanvasElement | null
    shadow: HTMLCanvasElement | null
    dx: number
    dy: number
    rot: number
    z: number
    delay: number
    seed: number
    a: number
    va: number // assembly 0..1 and its velocity
    dist: number
    // last drawn transform (for hover hit-testing)
    tx: number
    ty: number
    tr: number
    ts: number
}

function pointInPoly(x: number, y: number, poly: Pt[]) {
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i],
            [xj, yj] = poly[j]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
            inside = !inside
    }
    return inside
}

/* ------------------------------- geometry -------------------------------- */

function rng(seed: number) {
    let s = seed >>> 0
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
}

function clipHalf(
    poly: Pt[],
    px: number,
    py: number,
    nx: number,
    ny: number
): Pt[] {
    // keep points where (p - P)·n <= 0
    const out: Pt[] = []
    for (let i = 0; i < poly.length; i++) {
        const a = poly[i],
            b = poly[(i + 1) % poly.length]
        const da = (a[0] - px) * nx + (a[1] - py) * ny
        const db = (b[0] - px) * nx + (b[1] - py) * ny
        if (da <= 0) out.push(a)
        if (da <= 0 !== db <= 0) {
            const t = da / (da - db)
            out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
        }
    }
    return out
}

function voronoi(w: number, h: number, count: number, seed: number) {
    const r = rng(seed)
    const cols = Math.max(2, Math.round(Math.sqrt((count * w) / h)))
    const rows = Math.max(2, Math.round(count / cols))
    const sites: Pt[] = []
    for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++)
            sites.push([
                ((i + 0.15 + r() * 0.7) / cols) * w,
                ((j + 0.15 + r() * 0.7) / rows) * h,
            ])
    const cells: Pt[][] = []
    for (let s = 0; s < sites.length; s++) {
        let poly: Pt[] = [
            [0, 0],
            [w, 0],
            [w, h],
            [0, h],
        ]
        const [sx, sy] = sites[s]
        for (let o = 0; o < sites.length && poly.length; o++) {
            if (o === s) continue
            const [ox, oy] = sites[o]
            const dx = ox - sx,
                dy = oy - sy
            if (dx * dx + dy * dy > ((w * w + h * h) / (cols * rows)) * 9)
                continue
            poly = clipHalf(poly, (sx + ox) / 2, (sy + oy) / 2, dx, dy)
        }
        if (poly.length > 2) cells.push(poly)
    }
    return cells
}

function roundRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.moveTo(x + rr, y)
    ctx.arcTo(x + w, y, x + w, y + h, rr)
    ctx.arcTo(x + w, y + h, x, y + h, rr)
    ctx.arcTo(x, y + h, x, y, rr)
    ctx.arcTo(x, y, x + w, y, rr)
    ctx.closePath()
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const easeOutBack = (t: number) => {
    const c1 = 1.3,
        c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function dateProgress(start: string, launch: string) {
    const a = Date.parse(start),
        b = Date.parse(launch),
        n = Date.now()
    if (!isFinite(a) || !isFinite(b) || b <= a) return 0.4
    return clamp01((n - a) / (b - a))
}

/* -------------------------------- engine --------------------------------- */

export function createShatter(
    canvas: HTMLCanvasElement,
    host: HTMLElement,
    live: { current: any },
    src?: string,
    forceStatic = false
): () => void {
    const isStatic =
        forceStatic ||
        (typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
    const ctx = canvas.getContext("2d")!
    const st: any = {
        w: 1,
        h: 1,
        dpr: 1,
        img: null as HTMLImageElement | null,
        shards: [] as Shard[],
        poster: { x: 0, y: 0, w: 1, h: 1 },
        mouse: {
            x: -9999,
            y: -9999,
            on: false,
            sx: -9999,
            sy: -9999,
            fine: false,
        },
        hover: false,
        wholeA: 0,
        t: 0,
        burst: 0,
        burstV: 0,
        reveal: 0,
        revealT: -1,
        glint: -1,
        raf: 0,
    }

    const layout = () => {
        const P = live.current.props as Props
        const { w, h } = st
        const img = st.img as HTMLImageElement | null
        const iw = img?.naturalWidth || 4,
            ih = img?.naturalHeight || 5
        const ratios: Record<string, number> = {
            "4:5": 4 / 5,
            "3:4": 3 / 4,
            "1:1": 1,
            "16:10": 16 / 10,
            "16:9": 16 / 9,
        }
        const ar = P.ratio === "Image" ? iw / ih : ratios[P.ratio] || 0.8
        let pw = (w * P.posterWidth) / 100
        let ph = pw / ar
        const maxH = h * 0.78
        if (ph > maxH) {
            ph = maxH
            pw = ph * ar
        }
        st.poster = { x: (w - pw) / 2, y: (h - ph) / 2, w: pw, h: ph }
    }

    const build = () => {
        const P = live.current.props as Props
        layout()
        const { w: pw, h: ph } = st.poster
        const cells = voronoi(
            pw,
            ph,
            Math.max(12, Math.min(260, Math.round(P.shards))),
            7
        )
        const r = rng(19)
        const dpr = st.dpr
        const img = st.img as HTMLImageElement | null
        // cover-fit source rect
        let sx = 0,
            sy = 0,
            sw = 1,
            sh = 1
        if (img) {
            const iw = img.naturalWidth,
                ih = img.naturalHeight
            const s = Math.max(pw / iw, ph / ih)
            sw = pw / s
            sh = ph / s
            sx = (iw - sw) / 2
            sy = (ih - sh) / 2
        }
        const maxD = Math.hypot(pw, ph) / 2
        // the finished picture, drawn on top once every piece is home (hides the seams)
        const whole = document.createElement("canvas")
        whole.width = Math.ceil(pw * dpr)
        whole.height = Math.ceil(ph * dpr)
        const wg = whole.getContext("2d")!
        wg.scale(dpr, dpr)
        wg.beginPath()
        roundRectPath(wg, 0, 0, pw, ph, P.radius)
        wg.clip()
        if (img) wg.drawImage(img, sx, sy, sw, sh, 0, 0, pw, ph)
        st.whole = whole
        st.shards = cells.map((poly, k) => {
            let cx = 0,
                cy = 0
            poly.forEach((p) => {
                cx += p[0]
                cy += p[1]
            })
            cx /= poly.length
            cy /= poly.length
            let minx = Infinity,
                miny = Infinity,
                maxx = -Infinity,
                maxy = -Infinity
            poly.forEach(([x, y]) => {
                minx = Math.min(minx, x)
                miny = Math.min(miny, y)
                maxx = Math.max(maxx, x)
                maxy = Math.max(maxy, y)
            })
            const pad = 2
            const bx = minx - pad,
                by = miny - pad,
                bw = maxx - minx + pad * 2,
                bh = maxy - miny + pad * 2
            const c = document.createElement("canvas")
            c.width = Math.max(1, Math.ceil(bw * dpr))
            c.height = Math.max(1, Math.ceil(bh * dpr))
            const g = c.getContext("2d")!
            g.scale(dpr, dpr)
            g.translate(-bx, -by)
            g.save()
            g.beginPath()
            roundRectPath(g, 0, 0, pw, ph, P.radius)
            g.clip()
            g.beginPath()
            poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
            g.closePath()
            g.clip()
            if (img) g.drawImage(img, sx, sy, sw, sh, 0, 0, pw, ph)
            else {
                const gr = g.createLinearGradient(0, 0, pw, ph)
                gr.addColorStop(0, "#1b1b1f")
                gr.addColorStop(1, "#6d6a64")
                g.fillStyle = gr
                g.fillRect(0, 0, pw, ph)
            }
            if (P.edges) {
                // glassy bevel: bright top-left edge, dark bottom-right
                g.lineWidth = 1.4
                g.strokeStyle = "rgba(255,255,255,0.55)"
                g.stroke()
                const lg = g.createLinearGradient(minx, miny, maxx, maxy)
                lg.addColorStop(0, "rgba(255,255,255,0.16)")
                lg.addColorStop(0.45, "rgba(255,255,255,0)")
                lg.addColorStop(1, "rgba(0,0,0,0.12)")
                g.fillStyle = lg
                g.fill()
            }
            g.restore()
            let sc: HTMLCanvasElement | null = null
            if (P.shadows) {
                const sp = 18
                sc = document.createElement("canvas")
                const sw2 = bw + sp * 2,
                    sh2 = bh + sp * 2
                sc.width = Math.ceil(sw2)
                sc.height = Math.ceil(sh2)
                const s2 = sc.getContext("2d")!
                s2.filter = "blur(7px)"
                s2.translate(sp - bx, sp - by)
                s2.beginPath()
                poly.forEach(([x, y], i) =>
                    i ? s2.lineTo(x, y) : s2.moveTo(x, y)
                )
                s2.closePath()
                s2.fillStyle = "rgba(0,0,0,0.55)"
                s2.fill()
            }
            // exploded pose
            const ox = cx - pw / 2,
                oy = cy - ph / 2
            const d = Math.hypot(ox, oy) || 1
            const ang = Math.atan2(oy, ox) + (r() - 0.5) * 0.9
            const far = (0.35 + r() * 0.75) * Math.max(st.w, st.h) * 0.42
            return {
                poly,
                cx,
                cy,
                bx,
                by,
                bw,
                bh,
                img: c,
                shadow: sc,
                dx: Math.cos(ang) * far,
                dy: Math.sin(ang) * far * 0.8,
                rot: (r() - 0.5) * 1.6,
                z: 0.55 + r() * 0.9,
                delay: (d / maxD) * 0.55 + r() * 0.12,
                seed: r() * 100,
                a: 0,
                va: 0,
                dist: d / maxD,
                tx: -9999,
                ty: -9999,
                tr: 0,
                ts: 1,
            } as Shard
        })
        // paint order: far shards first
        st.shards.sort((a: Shard, b: Shard) => a.z - b.z)
        const P2 = live.current.props as Props
        const base = baseProgress(P2)
        st.shards.forEach((s: Shard) => (s.a = targetFor(s, base, P2)))
    }

    const baseProgress = (P: Props) => {
        const b =
            P.progressMode === "Countdown"
                ? dateProgress(P.startDate, P.launchDate)
                : clamp01(P.progress)
        return Math.max(b, st.reveal)
    }
    const targetFor = (s: Shard, base: number, P: Props) => {
        // inner shards arrive first as progress grows
        const local = clamp01((base - s.delay * 0.9) / 0.16)
        let tgt = base >= 0.999 ? 1 : local
        if (st.mouse.on && P.magnet > 0) {
            const hx = st.poster.x + s.cx,
                hy = st.poster.y + s.cy
            const cur = currentPos(s)
            const dx = (hx + cur[0]) / 2 - st.mouse.sx,
                dy = (hy + cur[1]) / 2 - st.mouse.sy
            const R = P.cursorRadius
            const f = Math.exp(-(dx * dx + dy * dy) / (R * R))
            tgt = Math.max(tgt, Math.min(1, f * P.magnet * 1.15))
        }
        return tgt
    }
    const currentPos = (s: Shard): Pt => {
        const P = live.current.props as Props
        const k = (1 - s.a) * P.spread + st.burst
        return [st.poster.x + s.cx + s.dx * k, st.poster.y + s.cy + s.dy * k]
    }

    const step = (dt: number) => {
        const P = live.current.props as Props
        st.t += dt
        const m = st.mouse
        m.sx += (m.x - m.sx) * 0.25
        m.sy += (m.y - m.sy) * 0.25
        // shockwave
        st.burstV += (-st.burst * 38 - st.burstV * 7.5) * dt
        st.burst += st.burstV * dt
        if (st.revealT >= 0) {
            st.revealT += dt
            st.reveal = clamp01(st.revealT / 0.9)
            if (st.revealT > 1.25 && st.glint < 0 && !st.glintDone) st.glint = 0
        } else st.reveal = Math.max(0, st.reveal - dt / 1.2)
        if (st.glint >= 0) {
            st.glint += dt / 1.1
            if (st.glint > 1.4) {
                st.glint = -1
                st.glintDone = true
            }
        }
        const base = baseProgress(P)
        for (const s of st.shards as Shard[]) {
            const tgt = targetFor(s, base, P)
            // spring toward target, a little bouncy
            const k = tgt > s.a ? 120 : 26,
                c = tgt > s.a ? 15 : 9
            s.va += ((tgt - s.a) * k - s.va * c) * dt
            s.a += s.va * dt
            s.a = Math.max(-0.2, Math.min(1.08, s.a))
        }
    }

    const draw = () => {
        const P = live.current.props as Props
        const { w, h, dpr } = st
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, w, h)
        const px = st.poster.x,
            py = st.poster.y
        // ghost frame where the picture will land
        const done =
            (st.shards as Shard[]).reduce((n, s) => n + clamp01(s.a), 0) /
            Math.max(1, st.shards.length)
        ctx.save()
        ctx.globalAlpha = 0.5 * (1 - done)
        ctx.setLineDash([3, 6])
        ctx.lineWidth = 1
        ctx.strokeStyle = "rgba(128,128,128,0.9)"
        ctx.beginPath()
        roundRectPath(ctx, px, py, st.poster.w, st.poster.h, P.radius)
        ctx.stroke()
        ctx.restore()
        const t = st.t
        for (const s of st.shards as Shard[]) {
            const a = s.a
            const inv = 1 - clamp01(a)
            const k = (1 - a) * P.spread + st.burst
            const bob = P.float * inv
            const fx = Math.sin(t * 0.7 + s.seed) * 10 * bob
            const fy = Math.cos(t * 0.55 + s.seed * 1.3) * 12 * bob
            const x = px + s.cx + s.dx * k + fx
            const y = py + s.cy + s.dy * k + fy
            const rot =
                s.rot * (1 - a + st.burst * 0.8) +
                Math.sin(t * 0.4 + s.seed) * 0.08 * bob
            const sc = 1 + (s.z - 1) * ((1 - a) * 0.9 + st.burst * 0.5)
            s.tx = x
            s.ty = y
            s.tr = rot
            s.ts = sc
            if (s.shadow && inv > 0.02) {
                ctx.save()
                ctx.globalAlpha = 0.28 * Math.min(1, inv * 1.6) * s.z
                const off = 14 + 26 * s.z * inv
                ctx.translate(x + off * 0.35, y + off)
                ctx.rotate(rot)
                ctx.scale(sc * 0.98, sc * 0.98)
                ctx.drawImage(s.shadow, s.bx - s.cx - 18, s.by - s.cy - 18)
                ctx.restore()
            }
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(rot)
            ctx.scale(sc, sc)
            ctx.drawImage(s.img!, s.bx - s.cx, s.by - s.cy, s.bw, s.bh)
            ctx.restore()
        }
        // seamless picture fades in when every shard has landed
        let minA = 1
        for (const s of st.shards as Shard[]) minA = Math.min(minA, s.a)
        const wholeA = clamp01((minA - 0.965) / 0.03)
        st.wholeA = wholeA
        if (st.whole && wholeA > 0) {
            ctx.save()
            ctx.globalAlpha = wholeA
            ctx.drawImage(st.whole, px, py, st.poster.w, st.poster.h)
            ctx.restore()
        }
        // glint sweep once the image is whole
        if (st.glint >= 0) {
            const gx = px - st.poster.w * 0.4 + st.glint * st.poster.w * 1.8
            ctx.save()
            ctx.beginPath()
            roundRectPath(ctx, px, py, st.poster.w, st.poster.h, P.radius)
            ctx.clip()
            ctx.globalCompositeOperation = "screen"
            const g = ctx.createLinearGradient(
                gx - 120,
                py,
                gx + 120,
                py + st.poster.h * 0.3
            )
            g.addColorStop(0, "rgba(255,255,255,0)")
            g.addColorStop(0.5, "rgba(255,255,255,0.55)")
            g.addColorStop(1, "rgba(255,255,255,0)")
            ctx.fillStyle = g
            ctx.fillRect(px, py, st.poster.w, st.poster.h)
            ctx.restore()
        }
        updateCursor()
    }

    // is the pointer over a visible piece (topmost first) or the whole picture?
    const hitTest = (mx: number, my: number) => {
        const p = st.poster
        if (
            st.wholeA > 0.5 &&
            mx >= p.x &&
            mx <= p.x + p.w &&
            my >= p.y &&
            my <= p.y + p.h
        )
            return true
        const list = st.shards as Shard[]
        for (let i = list.length - 1; i >= 0; i--) {
            const s = list[i]
            const dx = mx - s.tx,
                dy = my - s.ty
            if (
                Math.abs(dx) > s.bw * 1.6 + 20 ||
                Math.abs(dy) > s.bh * 1.6 + 20
            )
                continue
            const c = Math.cos(-s.tr),
                n = Math.sin(-s.tr)
            const lx = (dx * c - dy * n) / s.ts + s.cx,
                ly = (dx * n + dy * c) / s.ts + s.cy
            if (pointInPoly(lx, ly, s.poly)) return true
        }
        return false
    }

    const updateCursor = () => {
        const P = live.current.props as Props
        const el = live.current.cursorEl as HTMLDivElement | null
        const m = st.mouse
        const hit =
            P.hoverCursor !== false && m.on && m.fine && hitTest(m.x, m.y)
        if (el) {
            el.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`
            if (hit !== st.hover) el.dataset.on = hit ? "1" : "0"
        }
        if (hit !== st.hover) {
            host.style.cursor = hit ? "none" : ""
            st.hover = hit
        }
    }

    const resize = () => {
        const r = host.getBoundingClientRect()
        st.dpr = Math.min(window.devicePixelRatio || 1, 2)
        st.w = Math.max(2, r.width)
        st.h = Math.max(2, r.height)
        canvas.width = Math.round(st.w * st.dpr)
        canvas.height = Math.round(st.h * st.dpr)
        build()
        draw()
    }

    if (src) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            st.img = img
            build()
            draw()
        }
        img.src = src
    }

    let acc = 0,
        last = performance.now(),
        visible = true
    const loop = (now: number) => {
        st.raf = requestAnimationFrame(loop)
        if (!visible) {
            last = now
            return
        }
        acc += Math.min(0.05, (now - last) / 1000)
        last = now
        let n = 0
        while (acc >= 1 / 60 && n < 3) {
            step(1 / 60)
            acc -= 1 / 60
            n++
        }
        draw()
    }

    const reveal = (v: boolean) => {
        if (v) {
            if (st.revealT < 0) st.revealT = 0
        } else {
            st.revealT = -1
            st.glint = -1
            st.glintDone = false
        }
    }
    const onMove = (e: PointerEvent) => {
        const r = host.getBoundingClientRect()
        st.mouse.x = e.clientX - r.left
        st.mouse.y = e.clientY - r.top
        if (!st.mouse.on) {
            st.mouse.sx = st.mouse.x
            st.mouse.sy = st.mouse.y
        }
        st.mouse.on = true
        st.mouse.fine = e.pointerType === "mouse" || e.pointerType === "pen"
    }
    const onLeave = () => {
        st.mouse.on = false
        updateCursor()
    }
    const onClick = () => {
        const P = live.current.props as Props
        if (P.revealOn === "Click") reveal(st.revealT < 0)
        else if (P.clickBurst && st.revealT < 0) st.burstV += 3.2
    }
    const onSubmit = () => {
        if ((live.current.props as Props).revealOn === "Submit") reveal(true)
    }
    const onEvent = (e: Event) => reveal((e as CustomEvent).detail !== false)

    live.current.reveal = reveal
    if ((live.current.props as Props).revealed) {
        st.revealT = 1.3
        st.reveal = 1
    }
    resize()
    let ro: ResizeObserver | null = null,
        io: IntersectionObserver | null = null
    if (!isStatic) {
        ro = new ResizeObserver(resize)
        ro.observe(host)
        io = new IntersectionObserver(([en]) => (visible = en.isIntersecting))
        io.observe(host)
        host.addEventListener("pointermove", onMove)
        host.addEventListener("pointerleave", onLeave)
        host.addEventListener("click", onClick)
        document.addEventListener("submit", onSubmit, true)
        window.addEventListener("launch:reveal", onEvent)
        st.raf = requestAnimationFrame(loop)
    }
    ;(host as any).__shatter = { st, step, draw, build, reveal }
    return () => {
        cancelAnimationFrame(st.raf)
        ro?.disconnect()
        io?.disconnect()
        host.removeEventListener("pointermove", onMove)
        host.removeEventListener("pointerleave", onLeave)
        host.removeEventListener("click", onClick)
        document.removeEventListener("submit", onSubmit, true)
        window.removeEventListener("launch:reveal", onEvent)
        host.style.cursor = ""
    }
}

const cursorCSS = `
.fct-cur{position:absolute;left:0;top:0;pointer-events:none;z-index:5;will-change:transform}
.fct-cur>div{display:flex;align-items:center;gap:10px;transform:translate(calc(-100% + 28px),-50%) scale(.6);opacity:0;transition:opacity .18s ease,transform .28s cubic-bezier(.2,.9,.3,1.3)}
.fct-cur[data-on="1"]>div{opacity:1;transform:translate(calc(-100% + 28px),-50%) scale(1)}
.fct-cur .fct-lbl{background:#0e0e0e;color:#f2efe9;border-radius:999px;padding:7px 12px;font:400 11px/1.2 "Geist Mono","Geist Mono Placeholder",ui-monospace,monospace;letter-spacing:.33px;white-space:nowrap}
.fct-cur .fct-ring{width:56px;height:56px;border-radius:999px;border:1.5px solid rgba(14,14,14,.55);background:rgba(255,255,255,.18);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;box-sizing:border-box}
.fct-cur .fct-dot{width:6px;height:6px;border-radius:999px;background:#0e0e0e}
`

/* ------------------------------- component ------------------------------- */

export default function ShatterReveal(props: Props) {
    const {
        image,
        background,
        shards,
        posterWidth,
        ratio,
        radius,
        edges,
        shadows,
        revealed,
        hoverCursor = true,
        cursorLabel = "Pull the pieces together",
        style,
    } = props
    const wrap = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const cursorRef = useRef<HTMLDivElement>(null)
    const live = useRef<any>({})
    live.current.cursorEl = cursorRef.current
    const src = typeof image === "string" ? image : image?.src
    live.current.props = props

    useEffect(() => {
        const canvas = canvasRef.current,
            host = wrap.current
        if (!canvas || !host) return
        live.current.cursorEl = cursorRef.current
        return createShatter(canvas, host, live, src)
    }, [src, shards, posterWidth, ratio, radius, edges, shadows])

    useEffect(() => {
        live.current.reveal?.(!!revealed)
    }, [revealed])

    return (
        <div
            ref={wrap}
            style={{
                position: "relative",
                overflow: "hidden",
                background,
                touchAction: "pan-y",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                role="img"
                aria-label={typeof image === "object" ? image?.alt : undefined}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
            {hoverCursor && (
                <>
                    <style>{cursorCSS}</style>
                    <div
                        ref={cursorRef}
                        className="fct-cur"
                        data-on="0"
                        aria-hidden="true"
                    >
                        <div>
                            {cursorLabel ? (
                                <span className="fct-lbl">{cursorLabel}</span>
                            ) : null}
                            <span className="fct-ring">
                                <span className="fct-dot" />
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

ShatterReveal.defaultProps = {
    background: "rgba(0,0,0,0)",
    shards: 90,
    posterWidth: 36,
    ratio: "4:5",
    radius: 28,
    spread: 1,
    progressMode: "Manual",
    progress: 0.5,
    startDate: "2026-09-01",
    launchDate: "2026-10-10",
    magnet: 1,
    cursorRadius: 190,
    float: 1,
    edges: true,
    shadows: true,
    revealOn: "Submit",
    clickBurst: true,
    revealed: false,
    hoverCursor: true,
    cursorLabel: "Pull the pieces together",
}

