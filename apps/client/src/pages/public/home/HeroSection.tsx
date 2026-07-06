import { useState, useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ArchitectureDiagram from "./ArchitectureDiagram";

interface AnimatedUnderlineProps {
  delay: number;
  inView: boolean;
}

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const S = 0.12;

function HeroBackground({ inView }: { inView: boolean }) {
  const c = "var(--primary)";
  const reduced = useReducedMotion();

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 45% 42% at 8% 82%, color-mix(in srgb, ${c} 7%, transparent), transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 40% 40% at 95% 30%, color-mix(in srgb, ${c} 6%, transparent), transparent 65%)`,
        }}
      />

      <div
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--bg))",
        }}
      />
    </>
  );
}

function AnimatedUnderline({ delay, inView }: AnimatedUnderlineProps) {
  const reduced = useReducedMotion();
  return (
    <svg
      viewBox="0 0 220 20"
      fill="none"
      className="absolute right-0"
      style={{ bottom: "-11px", height: "20px", width: "55%" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ul-grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
          <stop offset="30%" stopColor="var(--primary)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="ul-grad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
          <stop offset="30%" stopColor="var(--primary)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.38" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0 7 C20 3, 50 12, 80 6 C110 0, 148 10, 178 5 C196 2, 210 8, 220 7"
        stroke="url(#ul-grad1)"
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
        initial={reduced ? {} : { pathLength: 0, opacity: 0 }}
        animate={
          inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }
        }
        transition={{ duration: 1.0, delay, ease: "easeInOut" }}
      />
      <motion.path
        d="M0 13 C20 9, 50 18, 80 12 C110 6, 148 16, 178 11 C196 8, 210 14, 220 13"
        stroke="url(#ul-grad2)"
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
        initial={reduced ? {} : { pathLength: 0, opacity: 0 }}
        animate={
          inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }
        }
        transition={{ duration: 1.0, delay: delay + 0.18, ease: "easeInOut" }}
      />
    </svg>
  );
}

function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center w-full max-w-xl"
    >
      <div
        className="absolute left-4 inset-y-0 flex items-center pointer-events-none"
        style={{ color: "var(--fg-muted)" }}
      >
        <Search size={20} />
      </div>
      <input
        type="text"
        placeholder="Search courses, technologies, or learning paths..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-14 pl-12 pr-32 rounded-2xl outline-none transition-all text-[15px]"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--primary)";
          e.target.style.boxShadow =
            "0 4px 20px rgba(0,0,0,0.05), 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--border)";
          e.target.style.boxShadow = "0 4px 20px rgba(0,0,0,0.05)";
        }}
      />
      <div className="absolute inset-y-1.5 right-1.5">
        <button
          type="submit"
          className="h-full px-5 rounded-xl font-bold text-[13px] transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)", color: "var(--primary-fg)" }}
        >
          Search
        </button>
      </div>
    </form>
  );
}

export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();

  return (
    <section
      ref={ref}
      className="relative flex items-center overflow-hidden"
      style={{ background: "var(--bg)", minHeight: "calc(100vh - 90px)" }}
    >
      <HeroBackground inView={inView} />
      <ArchitectureDiagram />

      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-[1fr_420px] gap-8 xl:gap-16 items-center">
          <div className="flex flex-col gap-6">
            <motion.div
              initial={reduced ? {} : { opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.55, delay: 0, ease: EASE_OUT }}
            >
              <span
                className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full"
                style={{
                  color: "var(--primary)",
                  border:
                    "1px solid color-mix(in srgb, var(--primary) 28%, transparent)",
                  background: "var(--primary-subtle)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "var(--primary)" }}
                />
                The Modern Learning Platform
              </span>
            </motion.div>

            <motion.h1
              initial={reduced ? {} : { opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: S, ease: EASE_OUT }}
              className="text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.1] tracking-tight"
              style={{ color: "var(--fg)" }}
            >
              Learn In-Demand Skills Through{" "}
              <span
                className="relative inline-block whitespace-nowrap"
                style={{ color: "var(--primary)" }}
              >
                Real Projects
                <AnimatedUnderline delay={S * 3 + 0.3} inView={inView} />
              </span>{" "}
              And Businesses Trust To Scale.
            </motion.h1>

            <motion.p
              initial={reduced ? {} : { opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: S * 2, ease: EASE_OUT }}
              className="text-base lg:text-[17px] max-w-[520px] leading-relaxed"
              style={{ color: "var(--fg-muted)" }}
            >
              Master web development with structured courses, hands-on projects,
              progress tracking, and professional certificates.
            </motion.p>

            <motion.div
              initial={reduced ? {} : { opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: S * 3, ease: EASE_OUT }}
              className="flex flex-wrap gap-3 pt-1"
            >
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-px group"
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-fg)",
                  boxShadow:
                    "0 0 24px color-mix(in srgb, var(--primary) 30%, transparent)",
                }}
              >
                Explore Courses
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>

              <Link
                to="/learning-paths"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  color: "var(--fg)",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.color = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--fg)";
                }}
              >
                View Learning Paths
              </Link>
            </motion.div>

            <motion.div
              initial={reduced ? {} : { opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              transition={{ duration: 0.6, delay: S * 4, ease: EASE_OUT }}
            >
              <SearchBar />
            </motion.div>
          </div>

          <div className="hidden lg:block pointer-events-none" />
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--bg))",
        }}
      />
    </section>
  );
}

export default HeroSection;
