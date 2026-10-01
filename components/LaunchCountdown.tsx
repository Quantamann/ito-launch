// Launch Countdown — Organza / Facette templates (Framer code component)
// Days / hours / minutes / seconds to your launch, with a soft digit roll.
import * as React from "react"
import { useEffect, useState } from "react"

type Props = {
    launchDate: string
    layout: "Inline" | "Large" | "Grid"
    labels: "Short" | "Long" | "None"
    separator: boolean
    font: any
    labelFont: any
    color: string
    labelColor: string
    separatorColor: string
    gap: number
    endText: string
    style?: React.CSSProperties
}

const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0")

function remaining(target: number) {
    const d = Math.max(0, target - Date.now())
    return {
        d: Math.floor(d / 864e5),
        h: Math.floor(d / 36e5) % 24,
        m: Math.floor(d / 6e4) % 60,
        s: Math.floor(d / 1e3) % 60,
        done: d <= 0,
    }
}

function Digit({
    value,
    style,
}: {
    value: string
    style: React.CSSProperties
}) {
    // key change re-mounts the span so the roll animation replays
    return (
        <span
            style={{
                display: "inline-block",
                overflow: "hidden",
                verticalAlign: "bottom",
                lineHeight: 1,
            }}
        >
            <span
                key={value}
                style={{
                    display: "inline-block",
                    animation: "launchRoll .45s cubic-bezier(.2,.8,.2,1)",
                    ...style,
                }}
            >
                {value}
            </span>
        </span>
    )
}

export default function LaunchCountdown(props: Props) {
    const {
        launchDate,
        layout,
        labels,
        separator,
        font,
        labelFont,
        color,
        labelColor,
        separatorColor,
        gap,
        endText,
        style,
    } = props
    const target = Date.parse(launchDate)
    const [t, setT] = useState(() =>
        remaining(isFinite(target) ? target : Date.now() + 18 * 864e5)
    )
    useEffect(() => {
        const id = setInterval(
            () => setT(remaining(isFinite(target) ? target : Date.now())),
            1000
        )
        return () => clearInterval(id)
    }, [target])

    if (t.done && endText)
        return <div style={{ ...font, color, ...style }}>{endText}</div>
    const names =
        labels === "Long"
            ? ["Days", "Hours", "Minutes", "Seconds"]
            : ["D", "H", "M", "S"]
    const units = [pad(t.d), pad(t.h), pad(t.m), pad(t.s)]
    const isGrid = layout === "Grid"
    const stacked = layout !== "Inline"
    return (
        <div
            style={{
                display: isGrid ? "grid" : "flex",
                gridTemplateColumns: isGrid ? "1fr 1fr" : undefined,
                alignItems: stacked ? "flex-start" : "baseline",
                gap,
                color,
                ...style,
            }}
        >
            <style>{`@keyframes launchRoll{from{transform:translateY(100%);opacity:.2}to{transform:none;opacity:1}}@media (prefers-reduced-motion: reduce){[style*="launchRoll"]{animation:none!important}}`}</style>
            {units.map((u, i) => (
                <React.Fragment key={i}>
                    {separator && i > 0 && !isGrid && (
                        <span style={{ ...font, color: separatorColor }}>
                            :
                        </span>
                    )}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: stacked ? "column" : "row",
                            alignItems: stacked ? "center" : "baseline",
                            gap: stacked ? 6 : 7,
                        }}
                    >
                        <span
                            style={{
                                ...font,
                                fontVariantNumeric: "tabular-nums",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Digit value={u} style={{}} />
                        </span>
                        {labels !== "None" && (
                            <span
                                style={{
                                    ...labelFont,
                                    color: labelColor,
                                    textTransform: "uppercase",
                                }}
                            >
                                {names[i]}
                            </span>
                        )}
                    </div>
                </React.Fragment>
            ))}
        </div>
    )
}

LaunchCountdown.defaultProps = {
    launchDate: "2026-10-10T09:00:00",
    layout: "Large",
    labels: "Long",
    separator: true,
    font: {
        fontFamily: "Geist",
        fontWeight: 200,
        fontSize: 200,
        letterSpacing: "-0.05em",
        lineHeight: 1,
    },
    labelFont: {
        fontFamily: "Geist Mono",
        fontSize: 12,
        letterSpacing: "0.1em",
    },
    color: "#F2EFE9",
    labelColor: "rgba(242,239,233,0.5)",
    separatorColor: "rgba(242,239,233,0.28)",
    gap: 26,
    endText: "We're live.",
}

