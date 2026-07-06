import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Layout, 
  Server, 
  Database, 
  Terminal, 
  Code2,
  CheckCircle2,
  Blocks,
  Cpu
} from "lucide-react";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { buttonClass } from "../../components/ui/Button";

const paths = [
  {
    id: "frontend",
    title: "Frontend Engineering",
    description: "Master modern user interfaces, component-driven architecture, and responsive web design.",
    icon: Layout,
    color: "from-blue-500 to-cyan-500",
    shadowColor: "rgba(6, 182, 212, 0.2)",
    steps: [
      { name: "HTML, CSS & JavaScript Fundamentals", icon: Code2 },
      { name: "React.js & State Management", icon: Blocks },
      { name: "Advanced UI/UX & Animations", icon: Layout },
      { name: "Performance & Architecture", icon: Cpu }
    ]
  },
  {
    id: "backend",
    title: "Backend Engineering",
    description: "Build robust, scalable APIs, microservices, and master complex database architecture.",
    icon: Server,
    color: "from-emerald-500 to-green-500",
    shadowColor: "rgba(16, 185, 129, 0.2)",
    steps: [
      { name: "Node.js & Express Fundamentals", icon: Terminal },
      { name: "SQL & NoSQL Databases", icon: Database },
      { name: "REST APIs & GraphQL", icon: Server },
      { name: "System Design & Security", icon: Blocks }
    ]
  },
  {
    id: "fullstack",
    title: "Full-Stack Development",
    description: "End-to-end application development, bridging the gap between client and server.",
    icon: Database,
    color: "from-purple-500 to-fuchsia-500",
    shadowColor: "rgba(168, 85, 247, 0.2)",
    steps: [
      { name: "Frontend Mastery", icon: Layout },
      { name: "Backend Infrastructure", icon: Server },
      { name: "Authentication & Authorization", icon: CheckCircle2 },
      { name: "Cloud Deployment & CI/CD", icon: Terminal }
    ]
  }
];

export function LearningPathsPage() {
  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden" style={{ background: "var(--bg)" }}>
        {/* Glow Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10 mix-blend-screen rounded-full blur-[80px]"
            style={{ background: "var(--primary)" }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-subtle text-primary text-[13px] font-bold tracking-wide uppercase mb-6">
              Guided Roadmaps
            </div>
            <h1
              className="text-[3rem] lg:text-[4rem] font-extrabold tracking-tight leading-[1.1] mb-6"
              style={{ color: "var(--fg)" }}
            >
              Master Your Craft.<br />
              <span className="text-primary">Step-by-Step.</span>
            </h1>
            <p
              className="text-[18px] max-w-2xl mx-auto leading-relaxed mb-10"
              style={{ color: "var(--fg-muted)" }}
            >
              Industry-aligned learning paths designed to take you from absolute beginner to job-ready software engineer through practical, real-world projects.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Paths Section */}
      <section className="py-20 relative" style={{ background: "var(--surface2)" }}>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(var(--fg) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="space-y-12">
            {paths.map((path, index) => (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative rounded-3xl overflow-hidden group"
                style={{
                  background: "rgba(15, 17, 23, 0.6)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--border)",
                  boxShadow: `0 20px 40px -20px ${path.shadowColor}`,
                }}
              >
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-0">
                  {/* Left content area */}
                  <div className="p-10 lg:p-12 relative z-10 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-line/30">
                    <div 
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${path.color} shadow-lg`}
                    >
                      <path.icon size={32} className="text-white" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--fg)" }}>
                      {path.title}
                    </h2>
                    <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--fg-muted)" }}>
                      {path.description}
                    </p>
                    <Link
                      to={`/search?q=${encodeURIComponent(path.title)}`}
                      className={buttonClass("primary", "md") + " inline-flex w-max"}
                      style={{ boxShadow: `0 8px 20px -8px ${path.shadowColor}` }}
                    >
                      Explore Courses <ArrowRight size={18} className="ml-2" />
                    </Link>
                  </div>

                  {/* Right roadmap area */}
                  <div className="p-10 lg:p-12 relative z-10 flex flex-col justify-center" style={{ background: "var(--surface)" }}>
                    <h3 className="font-bold text-[14px] uppercase tracking-wider mb-8" style={{ color: "var(--fg-muted)" }}>
                      Learning Roadmap
                    </h3>
                    
                    <div className="relative space-y-6">
                      {/* Connecting line */}
                      <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-line/50 z-0" />
                      
                      {path.steps.map((step, stepIdx) => (
                        <motion.div 
                          key={stepIdx}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + (stepIdx * 0.1) }}
                          className="relative z-10 flex items-center gap-6"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-surface border-2 border-line group-hover:border-primary/50 transition-colors duration-300`}>
                            <step.icon size={18} style={{ color: "var(--fg)" }} />
                          </div>
                          <div className="font-semibold text-[15px]" style={{ color: "var(--fg)" }}>
                            {step.name}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subtle hover background gradient */}
                <div 
                  className={`absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 bg-gradient-to-r ${path.color} pointer-events-none z-0`} 
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden" style={{ background: "var(--bg)" }}>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-[2.5rem] font-bold tracking-tight mb-6" style={{ color: "var(--fg)" }}>
              Ready to start your journey?
            </h2>
            <p className="text-[16px] max-w-2xl mx-auto mb-10" style={{ color: "var(--fg-muted)" }}>
              Join thousands of students who have already transformed their careers through our structured learning paths.
            </p>
            <Link
              to="/search"
              className={buttonClass("primary", "lg") + " shadow-xl"}
            >
              Browse All Courses
            </Link>
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  );
}
