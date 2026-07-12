import { motion, type Variants } from "framer-motion";
import {
  Award,
  Blocks,
  CheckCircle,
  Cloud,
  Database,
  Layout,
  MonitorPlay,
  Server,
  Terminal,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { FeaturedCoursesBg } from "./HomeSectionHeader";

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVars: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

function SkillsSection() {
  const skills = [
    { title: "Frontend Architecture", desc: "Build responsive, accessible, and highly performant user interfaces.", icon: Layout, color: "from-blue-500/20 to-cyan-500/20", iconColor: "text-cyan-400", borderHover: "group-hover:border-cyan-500/50" },
    { title: "Backend Engineering", desc: "Design scalable APIs and robust server-side applications.", icon: Server, color: "from-emerald-500/20 to-green-500/20", iconColor: "text-emerald-400", borderHover: "group-hover:border-emerald-500/50" },
    { title: "Cloud Deployment", desc: "Deploy and manage applications on modern cloud infrastructure.", icon: Cloud, color: "from-purple-500/20 to-fuchsia-500/20", iconColor: "text-fuchsia-400", borderHover: "group-hover:border-fuchsia-500/50" },
    { title: "Database Design", desc: "Master data modeling for robust SQL and NoSQL databases.", icon: Database, color: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-400", borderHover: "group-hover:border-amber-500/50" },
    { title: "System Design", desc: "Architect complex, high-traffic and distributed systems.", icon: Blocks, color: "from-rose-500/20 to-red-500/20", iconColor: "text-rose-400", borderHover: "group-hover:border-rose-500/50" },
    { title: "DevOps & Tooling", desc: "Streamline workflows with CI/CD and modern deployment tooling.", icon: Terminal, color: "from-indigo-500/20 to-blue-500/20", iconColor: "text-indigo-400", borderHover: "group-hover:border-indigo-500/50" },
  ];

  return (
    <section id="skills" className="py-24 relative overflow-hidden" style={{ background: "var(--surface2)" }}>
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
              style={{ background: "var(--card)", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}
            >
              <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${skill.color} rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 bg-gradient-to-br ${skill.color} border border-white/5`}>
                <skill.icon size={26} className={skill.iconColor} strokeWidth={1.5} />
              </div>
              <h3 className="text-[18px] font-bold mb-3 relative z-10" style={{ color: "var(--fg)" }}>{skill.title}</h3>
              <p className="text-[14px] leading-relaxed relative z-10" style={{ color: "var(--fg-muted)" }}>{skill.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyLearnSection() {
  const features = [
    { title: "Progress Tracking", icon: TrendingUp, desc: "Track lesson completion and continue where you left off without missing a beat." },
    { title: "Learn Anywhere", icon: MonitorPlay, desc: "Access courses seamlessly across your desktop, tablet, and mobile devices." },
    { title: "Professional Certificates", icon: Award, desc: "Earn verified, shareable certificates to showcase your new skills to employers." },
    { title: "Interactive Assessments", icon: CheckCircle, desc: "Test your knowledge with quizzes and coding challenges to reinforce learning." },
    { title: "Community Support", icon: Users, desc: "Join a vibrant community of learners to collaborate, ask questions, and grow together." },
    { title: "Modern Learning Experience", icon: Zap, desc: "Enjoy a blazing fast, distraction-free platform designed entirely for focused learning." },
  ];

  return (
    <section className="py-28 relative overflow-hidden bg-bg">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: "linear-gradient(var(--fg) 1px, transparent 1px), linear-gradient(90deg, var(--fg) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.08] mix-blend-screen" style={{ background: "radial-gradient(circle at 100% 0%, var(--primary) 0%, transparent 70%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, var(--bg) 0%, transparent 20%, transparent 80%, var(--bg) 100%)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-20">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-subtle shadow-sm">Platform Features</span>
          <h2 className="text-[2.5rem] lg:text-[3rem] font-extrabold tracking-tight mb-6 leading-[1.1]" style={{ color: "var(--fg)" }}>
            Everything You Need To <br className="hidden sm:block" /> Learn Effectively
          </h2>
          <p className="text-lg max-w-2xl leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            Discover all the features and tools we provide to make your learning journey seamless, engaging, and highly effective. Built for modern learners.
          </p>
        </div>

        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8" variants={containerVars} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}>
          {features.map((f) => (
            <motion.div key={f.title} variants={itemVars} className="relative p-6 sm:p-8 rounded-[32px] overflow-hidden group transition-transform duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-xl">
              <div className="absolute bottom-0 right-0 w-72 h-64 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_right,var(--primary),transparent_70%)] opacity-[0.08] transition-opacity duration-500 group-hover:opacity-20" />
              <div className="absolute top-0 left-8 right-8 h-px pointer-events-none opacity-60 transition-opacity group-hover:opacity-100" style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 35%, transparent) 40%, color-mix(in srgb, var(--primary) 35%, transparent) 60%, transparent)" }} />
              <div className="flex items-center gap-3 mb-5 relative z-10">
                <span className="h-px w-6 shrink-0 transition-all duration-300 group-hover:w-8" style={{ background: "var(--primary)" }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>FEATURE</span>
              </div>
              <div className="flex items-center gap-4 mb-5 relative z-10">
                <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 35%, transparent)", color: "var(--primary)" }}>
                  <f.icon size={24} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: "var(--fg)" }}>{f.title}</h3>
              </div>
              <p className="text-[15px] leading-relaxed relative z-10" style={{ color: "var(--fg-muted)" }}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default function HomeSkillsWhySection() {
  return (
    <>
      <SkillsSection />
      <WhyLearnSection />
    </>
  );
}
