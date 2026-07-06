import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Search,
  BookOpen,
  Layers,
  Zap,
  MonitorPlay,
  Award,
  CheckCircle,
  Plus,
  Minus,
  Database,
  Code2,
  Server,
  Layout,
  TrendingUp,
  X,
  Users,
  Cloud,
  Terminal,
  Blocks,
} from "lucide-react";
import { getFeatured } from "../../services/course.service";
import { PageWrapper } from "../../components/layout/PageWrapper";
import {
  CourseCard,
  CourseCardSkeleton,
} from "../../components/course/CourseCard";
import { buttonClass } from "../../components/ui/Button";
import HeroSection from "./home/HeroSection";

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVars = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export function HomePage() {
  return (
    <PageWrapper>
      <HeroSection />
      <FeaturedCoursesSection />
      <SkillsSection />
      <WhyLearnSection />
      <CertificateShowcaseSection />
      <FAQSection />
      <FinalCTASection />
    </PageWrapper>
  );
}

function SectionHeader({
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

function FeaturedCoursesBg() {
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
          <path
            d="M-80 300 Q200 80 520 220 Q840 360 1100 140 Q1230 30 1350 100"
            stroke="color-mix(in srgb, var(--primary) 15%, transparent)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M-80 400 Q200 180 520 320 Q840 460 1100 240 Q1230 130 1350 200"
            stroke="color-mix(in srgb, var(--primary) 10%, transparent)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M-80 500 Q200 280 520 420 Q840 560 1100 340 Q1230 230 1350 300"
            stroke="color-mix(in srgb, var(--primary) 5%, transparent)"
            strokeWidth="1"
            fill="none"
          />
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

function FeaturedCoursesSection() {
  const { data: featured, isLoading } = useQuery({
    queryKey: ["featured"],
    queryFn: getFeatured,
  });

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Soft uniform dot grid — no directional gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, color-mix(in srgb, var(--primary) 18%, transparent) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          opacity: 0.35,
        }}
      />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <SectionHeader
          title="Featured Courses"
          subtitle="Explore our most popular courses designed to help you build practical skills and real-world projects."
          to="/search"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))
            : featured
                ?.slice(0, 4)
                .map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
        </div>
      </div>
    </section>
  );
}



function SkillsSection() {
  const skills = [
    {
      title: "Frontend Architecture",
      desc: "Build responsive, accessible, and highly performant user interfaces.",
      icon: Layout,
      color: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-cyan-400",
      borderHover: "group-hover:border-cyan-500/50"
    },
    {
      title: "Backend Engineering",
      desc: "Design scalable APIs and robust server-side applications.",
      icon: Server,
      color: "from-emerald-500/20 to-green-500/20",
      iconColor: "text-emerald-400",
      borderHover: "group-hover:border-emerald-500/50"
    },
    {
      title: "Cloud Deployment",
      desc: "Deploy and manage applications on modern cloud infrastructure.",
      icon: Cloud,
      color: "from-purple-500/20 to-fuchsia-500/20",
      iconColor: "text-fuchsia-400",
      borderHover: "group-hover:border-fuchsia-500/50"
    },
    {
      title: "Database Design",
      desc: "Master data modeling for robust SQL and NoSQL databases.",
      icon: Database,
      color: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
      borderHover: "group-hover:border-amber-500/50"
    },
    {
      title: "System Design",
      desc: "Architect complex, high-traffic and distributed systems.",
      icon: Blocks,
      color: "from-rose-500/20 to-red-500/20",
      iconColor: "text-rose-400",
      borderHover: "group-hover:border-rose-500/50"
    },
    {
      title: "DevOps & Tooling",
      desc: "Streamline workflows with CI/CD and modern deployment tooling.",
      icon: Terminal,
      color: "from-indigo-500/20 to-blue-500/20",
      iconColor: "text-indigo-400",
      borderHover: "group-hover:border-indigo-500/50"
    }
  ];

  return (
    <section
      id="skills"
      className="py-24 relative overflow-hidden"
      style={{ background: "var(--surface2)" }}
    >
      <FeaturedCoursesBg />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill, idx) => (
            <motion.div
              key={skill.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`p-8 rounded-[24px] relative group overflow-hidden transition-all duration-500 border border-transparent ${skill.borderHover}`}
              style={{
                background: "var(--card)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
              }}
            >
              <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${skill.color} rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 bg-gradient-to-br ${skill.color} border border-white/5`}>
                <skill.icon size={26} className={skill.iconColor} strokeWidth={1.5} />
              </div>

              <h3 className="text-[18px] font-bold mb-3 relative z-10" style={{ color: "var(--fg)" }}>
                {skill.title}
              </h3>

              <p className="text-[14px] leading-relaxed relative z-10" style={{ color: "var(--fg-muted)" }}>
                {skill.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyLearnSection() {
  const features = [
    {
      title: "Progress Tracking",
      icon: TrendingUp,
      desc: "Track lesson completion and continue where you left off without missing a beat.",
    },
    {
      title: "Learn Anywhere",
      icon: MonitorPlay,
      desc: "Access courses seamlessly across your desktop, tablet, and mobile devices.",
    },
    {
      title: "Professional Certificates",
      icon: Award,
      desc: "Earn verified, shareable certificates to showcase your new skills to employers.",
    },
    {
      title: "Interactive Assessments",
      icon: CheckCircle,
      desc: "Test your knowledge with quizzes and coding challenges to reinforce learning.",
    },
    {
      title: "Community Support",
      icon: Users,
      desc: "Join a vibrant community of learners to collaborate, ask questions, and grow together.",
    },
    {
      title: "Modern Learning Experience",
      icon: Zap,
      desc: "Enjoy a blazing fast, distraction-free platform designed entirely for focused learning.",
    },
  ];

  return (
    <section className="py-28 relative overflow-hidden bg-bg">
      {/* Background Design */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(var(--fg) 1px, transparent 1px), linear-gradient(90deg, var(--fg) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.08] mix-blend-screen"
          style={{ background: 'radial-gradient(circle at 100% 0%, var(--primary) 0%, transparent 70%)' }}
        />

        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, var(--bg) 0%, transparent 20%, transparent 80%, var(--bg) 100%)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-20">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-subtle shadow-sm">
            Platform Features
          </span>
          <h2
            className="text-[2.5rem] lg:text-[3rem] font-extrabold tracking-tight mb-6 leading-[1.1]"
            style={{ color: "var(--fg)" }}
          >
            Everything You Need To <br className="hidden sm:block" /> Learn Effectively
          </h2>
          <p className="text-lg max-w-2xl leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            Discover all the features and tools we provide to make your learning journey seamless, engaging, and highly effective. Built for modern learners.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          variants={containerVars}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((f, idx) => (
            <motion.div
              key={f.title}
              variants={itemVars}
              className="relative p-6 sm:p-8 rounded-[32px] overflow-hidden group transition-transform duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-xl"
            >
              <div
                className="absolute bottom-0 right-0 w-72 h-64 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_right,var(--primary),transparent_70%)] opacity-[0.08] transition-opacity duration-500 group-hover:opacity-20"
              />

              <div
                className="absolute top-0 left-8 right-8 h-px pointer-events-none opacity-60 transition-opacity group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 35%, transparent) 40%, color-mix(in srgb, var(--primary) 35%, transparent) 60%, transparent)`
                }}
              />

              <div className="flex items-center gap-3 mb-5 relative z-10">
                <span className="h-px w-6 shrink-0 transition-all duration-300 group-hover:w-8" style={{ background: 'var(--primary)' }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: 'var(--primary)' }}
                >
                  FEATURE
                </span>
              </div>

              <div className="flex items-center gap-4 mb-5 relative z-10">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{
                    background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--primary) 35%, transparent)",
                    color: "var(--primary)"
                  }}
                >
                  <f.icon size={24} strokeWidth={2} />
                </div>
                <h3
                  className="text-xl font-bold"
                  style={{ color: "var(--fg)" }}
                >
                  {f.title}
                </h3>
              </div>

              <p
                className="text-[15px] leading-relaxed relative z-10"
                style={{ color: "var(--fg-muted)" }}
              >
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CertificateShowcaseSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] right-[10%] w-[1000px] h-[1000px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 60%)' }} />
        <div className="absolute top-[40%] left-[-15%] w-[800px] h-[800px] rounded-full opacity-[0.05] dark:opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 60%)' }} />

        <div className="absolute inset-0 opacity-[0.2] dark:opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at center, transparent 0%, var(--bg) 80%)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" />
      </div>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-subtle shadow-sm">
            Get Certified
          </span>
          <h2
            className="text-[2.5rem] font-bold tracking-tight mb-5 leading-tight"
            style={{ color: "var(--fg)" }}
          >
            Earn Industry-Ready Certificates
          </h2>
          <p
            className="text-[16px] leading-relaxed mb-8 max-w-md"
            style={{ color: "var(--fg-muted)" }}
          >
            Complete courses successfully and receive professional certificates
            that can be shared with employers, clients, and your professional
            network.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className={
              buttonClass("primary", "lg") +
              " shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_30%,transparent)]"
            }
          >
            View Sample Certificate
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div
            className="w-full aspect-[1.4] rounded-2xl relative shadow-2xl p-2 border border-line flex items-center justify-center overflow-hidden group cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: 'url(/sample_certificate.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            {/* Overlay to ensure icons and lines are visible */}
            <div className="absolute inset-0 z-0 bg-surface/80 dark:bg-surface/90 backdrop-blur-[2px]" />

            <div className="relative z-10 text-center flex flex-col items-center">
              <Award
                size={64}
                className="text-primary mb-4 opacity-90 transition-transform duration-500 group-hover:scale-110"
                strokeWidth={1.5}
              />
              <div className="w-48 h-2.5 bg-line/80 rounded-full mb-3 shadow-sm" />
              <div className="w-32 h-2.5 bg-line/80 rounded-full mb-8 shadow-sm" />
              <div className="w-64 h-3 bg-primary/30 rounded-full mb-5 shadow-sm" />
              <div className="flex gap-3">
                <div className="w-20 h-1.5 bg-line/80 rounded-full shadow-sm" />
                <div className="w-20 h-1.5 bg-line/80 rounded-full shadow-sm" />
              </div>
            </div>

            {/* Glossy overlay effect */}
            <div className="absolute inset-0 z-20 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          >
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ type: "spring", damping: 30, stiffness: 300 }}
               className="relative w-[95vw] h-[90vh] lg:max-w-4xl lg:h-[70vh] flex flex-col items-center justify-center"
               onClick={(e) => e.stopPropagation()}
             >
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute -top-12 right-0 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white transition-colors shadow-lg z-10"
                >
                  <X size={24} />
                </button>
                <div
                  className="w-full h-full rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden relative"
                  style={{ background: 'var(--primary)', padding: '6px' }}
                >
                  <div className="w-full h-full relative rounded-xl overflow-hidden bg-surface flex items-center justify-center">
                    <img
                      src="/sample_certificate.png"
                      alt="Sample Certificate"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "How do I purchase a course and what payment methods are accepted?",
      a: "You can securely purchase any course using major credit/debit cards, PayPal, and regional payment gateways. Your enrollment is instantly activated upon successful payment.",
    },
    {
      q: "Are the courses live or pre-recorded?",
      a: "All our courses feature high-quality, pre-recorded video lectures. This allows you to learn at your exact own pace, pause, rewind, and re-watch complex topics whenever it fits your schedule.",
    },
    {
      q: "Do I get lifetime access to the courses I buy?",
      a: "Yes! Once you purchase a course, you are granted unlimited lifetime access to all its current contents, including any future updates to the curriculum.",
    },
    {
      q: "Can I watch the videos on my mobile device or tablet?",
      a: "Absolutely. VeoLMS is fully responsive. You can seamlessly switch between your desktop, tablet, and mobile phone to continue your learning journey on the go without losing progress.",
    },
    {
      q: "What if I get stuck or need help understanding a concept?",
      a: "Every course includes a dedicated discussion Q&A section where you can ask questions, interact with fellow students, and get clarifications directly from the instructors.",
    },
    {
      q: "Will I receive a certificate upon course completion?",
      a: "Yes! After successfully completing all video modules and associated assignments, you will automatically receive a verifiable digital certificate to showcase your new skills on LinkedIn or your resume.",
    },
    {
      q: "Is there any prerequisite knowledge required before enrolling?",
      a: "This varies by course. Beginner courses assume zero prior knowledge, while intermediate and advanced courses will clearly list their specific prerequisites on the course overview page.",
    },
    {
      q: "Are there practical projects and assignments included?",
      a: "We deeply believe in learning by doing. Our courses are packed with hands-on projects, coding exercises, and real-world assignments to ensure you actually master the practical skills.",
    },
    {
      q: "What is your refund policy?",
      a: "We offer a risk-free 30-day money-back guarantee. If you are not completely satisfied with your learning experience, you can easily request a full refund within the first 30 days of purchase.",
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Glow Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute bottom-[-30%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.04] mix-blend-screen"
          style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-subtle text-primary text-[13px] font-bold tracking-wide uppercase mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Support & FAQs
            </div>
            <h2
              className="text-[2.5rem] lg:text-[3rem] font-extrabold tracking-tight leading-[1.1] mb-6"
              style={{ color: "var(--fg)" }}
            >
              Got Questions? <span className="text-primary">We've Got Answers.</span>
            </h2>
            <p
              className="text-[16px] max-w-2xl leading-relaxed mb-8"
              style={{ color: "var(--fg-muted)" }}
            >
              Everything you need to know about purchasing, accessing, and learning from our recorded courses.
              If you can't find your answer here, feel free to <Link to="/contact" className="text-primary hover:underline">contact our support team</Link>.
            </p>
          </motion.div>
        </div>

        {/* Accordions */}
        <div className="space-y-4 max-w-4xl mx-auto w-full">
            {faqs.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: idx * 0.05, ease: "easeOut" }}
                  className="rounded-2xl overflow-hidden transition-all duration-300 relative group"
                  style={{
                    border: "1px solid",
                    borderColor: isOpen ? "var(--primary)" : "var(--border)",
                    background: isOpen ? "var(--surface2)" : "rgba(15, 17, 23, 0.4)",
                    backdropFilter: "blur(12px)",
                    boxShadow: isOpen ? "0 10px 30px -10px rgba(0,0,0,0.3)" : "none",
                  }}
                >
                  {/* Subtle hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 2%, transparent), transparent)" }}
                  />

                  <button
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full px-6 py-6 flex items-start justify-between text-left focus:outline-none relative z-10"
                  >
                    <span
                      className="font-bold text-[16px] leading-snug pr-8"
                      style={{ color: isOpen ? "var(--fg)" : "var(--fg-muted)" }}
                    >
                      {faq.q}
                    </span>
                    <span
                      className={`shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isOpen ? "bg-primary text-bg" : "bg-primary-subtle text-primary"
                      }`}
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      {isOpen ? <Minus size={15} strokeWidth={2.5} /> : <Plus size={15} strokeWidth={2.5} />}
                    </span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden relative z-10"
                      >
                        <div
                          className="px-6 pb-6 pt-0 text-[15px] leading-relaxed"
                          style={{ color: "var(--fg-muted)" }}
                        >
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-[20%] w-[500px] h-[500px] rounded-full opacity-[0.05] mix-blend-screen"
          style={{
            background:
              "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-[20%] w-[500px] h-[500px] rounded-full opacity-[0.05] mix-blend-screen"
          style={{
            background:
              "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2
            className="text-[3rem] font-extrabold tracking-tight leading-[1.1] mb-6"
            style={{ color: "var(--fg)" }}
          >
            Start Your Learning <br className="hidden sm:block" /> Journey Today
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Join learners building practical skills through structured courses
            and real-world projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/search"
              className={
                buttonClass("primary", "lg") +
                " font-bold text-[15px] shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_30%,transparent)] group"
              }
            >
              Explore Courses{" "}
              <ArrowRight
                size={18}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <Link
              to="/register"
              className={
                buttonClass("outline", "lg") + " font-bold text-[15px]"
              }
            >
              Create Free Account
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
