import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  to,
}: {
  title: string;
  subtitle: string;
  to?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4"
    >
      <div>
        <h2
          className="text-[2rem] font-bold tracking-tight leading-tight mb-3"
          style={{ color: "var(--fg)" }}
        >
          {title}
        </h2>
        <p
          className="text-[15px] max-w-2xl leading-relaxed"
          style={{ color: "var(--fg-muted)" }}
        >
          {subtitle}
        </p>
      </div>
      {to && (
        <Link
          to={to}
          className="text-[14px] font-bold text-primary flex items-center gap-1.5 shrink-0 hover:underline"
        >
          View all <ArrowRight size={16} />
        </Link>
      )}
    </motion.div>
  );
}

export function FeaturedCoursesBg() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, var(--bg) 0%, var(--surface2) 30%, var(--surface2) 70%, var(--bg) 100%)`,
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fc-v-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="20%" stopColor="white" stopOpacity="1" />
            <stop offset="80%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="fc-v-mask">
            <rect width="1200" height="600" fill="url(#fc-v-fade)" />
          </mask>
        </defs>
        <g mask="url(#fc-v-mask)">
          <path d="M-80 300 Q200 80 520 220 Q840 360 1100 140 Q1230 30 1350 100" stroke="color-mix(in srgb, var(--primary) 15%, transparent)" strokeWidth="1.5" fill="none" />
          <path d="M-80 400 Q200 180 520 320 Q840 460 1100 240 Q1230 130 1350 200" stroke="color-mix(in srgb, var(--primary) 10%, transparent)" strokeWidth="1.5" fill="none" />
          <path d="M-80 500 Q200 280 520 420 Q840 560 1100 340 Q1230 230 1350 300" stroke="color-mix(in srgb, var(--primary) 5%, transparent)" strokeWidth="1" fill="none" />
          <circle cx="520" cy="220" r="4" fill="color-mix(in srgb, var(--primary) 30%, transparent)" />
          <circle cx="840" cy="360" r="3" fill="color-mix(in srgb, var(--primary) 25%, transparent)" />
          <circle cx="280" cy="280" r="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" />
          <circle cx="960" cy="200" r="2.5" fill="color-mix(in srgb, var(--primary) 15%, transparent)" />
          <circle cx="160" cy="350" r="2.5" fill="color-mix(in srgb, var(--primary) 15%, transparent)" />
          <circle cx="1060" cy="270" r="2.5" fill="color-mix(in srgb, var(--primary) 15%, transparent)" />
        </g>
      </svg>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--primary) 5%, transparent) 0%, transparent 40%)`,
        }}
      />
    </>
  );
}
