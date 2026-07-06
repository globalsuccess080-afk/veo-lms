"use client";

import { motion } from "framer-motion";

/**
 * Learning-journey diagram.
 * Six-stage path (Start → Enroll → Learn → Build → Certify → Land the job)
 * anchored to the right side of the hero so it never competes with the
 * headline/copy column. Nodes reveal strictly one at a time — each
 * connector only starts drawing once its origin node has finished
 * appearing, and the next node only appears once the connector lands.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const FONT = "'Inter', 'Segoe UI', ui-sans-serif, system-ui, sans-serif";

// Compact viewBox that hugs just the diagram's own footprint. Combined with
// preserveAspectRatio="xMaxYMid" on the <svg> and a right-anchored wrapper,
// this keeps the whole diagram pinned to the right ~45% of the hero,
// regardless of how wide the hero itself is.
const VB_W = 620;
const VB_H = 700;

const STAGES = [
    { key: "start", label: "Start Journey", sub: "", x: 16, y: 588 },
    { key: "enroll", label: "Enroll in a Course", sub: "", x: 140, y: 486 },
    { key: "learn", label: "Learn Concepts", sub: "& Practice Daily", x: 262, y: 384 },
    { key: "build", label: "Build Real", sub: "Projects", x: 344, y: 274 },
    { key: "certify", label: "Earn", sub: "Certificate", x: 406, y: 164 },
    { key: "land", label: "Land Your", sub: "Dream Job", x: 436, y: 54 },
] as const;

const COLORS = [
    "#2dd4bf", // teal
    "#38bdf8", // sky
    "#6366f1", // indigo
    "#a855f7", // violet
    "#ec4899", // pink
    "#fbbf24", // gold — final, celebratory
];

const NODE_W = 176;
const NODE_H = 68;

// Progressive-reveal timing: each node's own entrance takes ~0.5s. The
// connector to the next node only begins once that settles, and the next
// node only appears once the connector has landed — so the sequence reads
// as "one thing, then the next," never as several elements animating at once.
const NODE_SETTLE = 0.5; // matches the rect's own transition duration below
const CONNECTOR_DURATION = 0.32;
const STEP = NODE_SETTLE + CONNECTOR_DURATION + 0.05; // ≈ 0.87s per stage
const BASE_DELAY = 0.2;

function nodeDelay(i: number) {
    return BASE_DELAY + i * STEP;
}

function connectorDelay(i: number) {
    // Starts right as node i finishes settling into place.
    return nodeDelay(i) + NODE_SETTLE;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Connector({
    from,
    to,
    colorA,
    colorB,
    id,
    delay,
}: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    colorA: string;
    colorB: string;
    id: string;
    delay: number;
}) {
    // Exit near the top-right corner of the origin node, enter near the
    // bottom-left corner of the destination node — reads as a continuous
    // ascending line rather than center-to-center spokes.
    const sx = from.x + NODE_W - 18;
    const sy = from.y - 4;
    const ex = to.x + 16;
    const ey = to.y + NODE_H + 4;

    const midX = (sx + ex) / 2;
    const d = `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ey}, ${ex} ${ey}`;

    return (
        <g>
            <defs>
                <linearGradient id={id} x1={sx} y1={sy} x2={ex} y2={ey} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={colorA} />
                    <stop offset="100%" stopColor={colorB} />
                </linearGradient>
            </defs>
            <motion.path
                d={d}
                stroke={`url(#${id})`}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.9 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: CONNECTOR_DURATION, delay, ease: EASE }}
            />
            <motion.polygon
                points={`${ex - 8},${ey - 6} ${ex + 6},${ey} ${ex - 8},${ey + 6}`}
                fill={colorB}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.2, delay: delay + CONNECTOR_DURATION - 0.05, ease: "easeOut" }}
                style={{ transformOrigin: `${ex}px ${ey}px` }}
            />
        </g>
    );
}

function StageNode({
    stage,
    index,
    color,
    isFinal,
}: {
    stage: (typeof STAGES)[number];
    index: number;
    color: string;
    isFinal: boolean;
}) {
    const delay = nodeDelay(index);
    const num = String(index + 1).padStart(2, "0");

    return (
        <g transform={`translate(${stage.x}, ${stage.y})`}>
            <motion.rect
                x={0}
                y={0}
                width={NODE_W}
                height={NODE_H}
                rx={14}
                fill="rgba(15, 17, 23, 0.72)"
                stroke={color}
                strokeWidth={isFinal ? 2 : 1.4}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: NODE_SETTLE, delay, ease: EASE }}
                style={{
                    filter: isFinal
                        ? `drop-shadow(0 0 14px ${color}66)`
                        : `drop-shadow(0 0 6px ${color}33)`,
                }}
            />

            {/* step index badge */}
            <motion.circle
                cx={-2}
                cy={-2}
                r={13}
                fill="#0f1117"
                stroke={color}
                strokeWidth={1.4}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.3, delay: delay + 0.1, ease: EASE }}
            />
            <motion.text
                x={-2}
                y={-1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontSize={11}
                fontWeight={700}
                fontFamily={FONT}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.25, delay: delay + 0.16 }}
            >
                {num}
            </motion.text>

            {/* label */}
            <motion.text
                x={NODE_W / 2}
                y={stage.sub ? NODE_H / 2 - 9 : NODE_H / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#f4f5f7"
                fontSize={14.5}
                fontWeight={600}
                fontFamily={FONT}
                letterSpacing="0.01em"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.3, delay: delay + 0.18, ease: "easeOut" }}
            >
                {stage.label}
            </motion.text>
            {stage.sub && (
                <motion.text
                    x={NODE_W / 2}
                    y={NODE_H / 2 + 13}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={color}
                    fontSize={12.5}
                    fontWeight={500}
                    fontFamily={FONT}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.3, delay: delay + 0.22, ease: "easeOut" }}
                >
                    {stage.sub}
                </motion.text>
            )}
        </g>
    );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function ArchitectureDiagram() {
    return (
        // Right-anchored panel: only occupies the right ~46% of the hero, so it
        // physically cannot sit on top of the headline / paragraph / search bar
        // no matter how the flex layout reshuffles at different widths.
        <div
            className="absolute inset-y-0 right-0 pointer-events-none z-10 hidden lg:block"
            style={{ width: "46%", maxHeight: "70vh", right: "15%", top: "8%" }}
        >
            <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="w-full h-full"
                preserveAspectRatio="xMaxYMid meet"
                style={{ maxHeight: "70vh" }}
            >
                {STAGES.slice(0, -1).map((stage, i) => (
                    <Connector
                        key={`edge-${stage.key}`}
                        id={`grad-${stage.key}`}
                        from={stage}
                        to={STAGES[i + 1]}
                        colorA={COLORS[i]}
                        colorB={COLORS[i + 1]}
                        delay={connectorDelay(i)}
                    />
                ))}

                {STAGES.map((stage, i) => (
                    <StageNode
                        key={stage.key}
                        stage={stage}
                        index={i}
                        color={COLORS[i]}
                        isFinal={i === STAGES.length - 1}
                    />
                ))}
            </svg>
        </div>
    );
}
