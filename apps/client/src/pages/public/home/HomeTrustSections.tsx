import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Award, Minus, Plus, X } from "lucide-react";
import { buttonClass } from "../../../components/ui/Button";

function CertificateShowcaseSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] right-[10%] w-[1000px] h-[1000px] rounded-full opacity-[0.06] dark:opacity-[0.04]" style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 60%)" }} />
        <div className="absolute top-[40%] left-[-15%] w-[800px] h-[800px] rounded-full opacity-[0.05] dark:opacity-[0.03]" style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 opacity-[0.2] dark:opacity-[0.1]" style={{ backgroundImage: "radial-gradient(var(--primary) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, transparent 0%, var(--bg) 80%)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" />
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-subtle shadow-sm">Get Certified</span>
          <h2 className="text-[2.5rem] font-bold tracking-tight mb-5 leading-tight" style={{ color: "var(--fg)" }}>Earn Industry-Ready Certificates</h2>
          <p className="text-[16px] leading-relaxed mb-8 max-w-md" style={{ color: "var(--fg-muted)" }}>
            Complete courses successfully and receive professional certificates that can be shared with employers, clients, and your professional network.
          </p>
          <button onClick={() => setIsModalOpen(true)} className={buttonClass("primary", "lg") + " shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_30%,transparent)]"}>
            View Sample Certificate
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <button
            type="button"
            className="w-full aspect-[1.4] rounded-2xl relative shadow-2xl p-2 border border-line flex items-center justify-center overflow-hidden group cursor-pointer"
            onClick={() => setIsModalOpen(true)}
            aria-label="View sample certificate"
          >
            <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url(/sample_certificate.png)", backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="absolute inset-0 z-0 bg-surface/80 dark:bg-surface/90 backdrop-blur-[2px]" />
            <div className="relative z-10 text-center flex flex-col items-center">
              <Award size={64} className="text-primary mb-4 opacity-90 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
              <div className="w-48 h-2.5 bg-line/80 rounded-full mb-3 shadow-sm" />
              <div className="w-32 h-2.5 bg-line/80 rounded-full mb-8 shadow-sm" />
              <div className="w-64 h-3 bg-primary/30 rounded-full mb-5 shadow-sm" />
              <div className="flex gap-3">
                <div className="w-20 h-1.5 bg-line/80 rounded-full shadow-sm" />
                <div className="w-20 h-1.5 bg-line/80 rounded-full shadow-sm" />
              </div>
            </div>
            <div className="absolute inset-0 z-20 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          </button>
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
              <button onClick={() => setIsModalOpen(false)} className="absolute -top-12 right-0 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white transition-colors shadow-lg z-10" aria-label="Close certificate preview">
                <X size={24} />
              </button>
              <div className="w-full h-full rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden relative" style={{ background: "var(--primary)", padding: "6px" }}>
                <div className="w-full h-full relative rounded-xl overflow-hidden bg-surface flex items-center justify-center">
                  <img src="/sample_certificate.png" alt="Sample Certificate" className="w-full h-full object-contain" />
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
    ["How do I purchase a course and what payment methods are accepted?", "You can securely purchase any course using major credit/debit cards, PayPal, and regional payment gateways. Your enrollment is instantly activated upon successful payment."],
    ["Are the courses live or pre-recorded?", "All our courses feature high-quality, pre-recorded video lectures. This allows you to learn at your exact own pace, pause, rewind, and re-watch complex topics whenever it fits your schedule."],
    ["Do I get lifetime access to the courses I buy?", "Yes! Once you purchase a course, you are granted unlimited lifetime access to all its current contents, including any future updates to the curriculum."],
    ["Can I watch the videos on my mobile device or tablet?", "Absolutely. VeoLMS is fully responsive. You can seamlessly switch between your desktop, tablet, and mobile phone to continue your learning journey on the go without losing progress."],
    ["What if I get stuck or need help understanding a concept?", "Every course includes a dedicated discussion Q&A section where you can ask questions, interact with fellow students, and get clarifications directly from the instructors."],
    ["Will I receive a certificate upon course completion?", "Yes! After successfully completing all video modules and associated assignments, you will automatically receive a verifiable digital certificate to showcase your new skills on LinkedIn or your resume."],
    ["Is there any prerequisite knowledge required before enrolling?", "This varies by course. Beginner courses assume zero prior knowledge, while intermediate and advanced courses will clearly list their specific prerequisites on the course overview page."],
    ["Are there practical projects and assignments included?", "We deeply believe in learning by doing. Our courses are packed with hands-on projects, coding exercises, and real-world assignments to ensure you actually master the practical skills."],
    ["What is your refund policy?", "We offer a risk-free 30-day money-back guarantee. If you are not completely satisfied with your learning experience, you can easily request a full refund within the first 30 days of purchase."],
  ];
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-[-30%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.04] mix-blend-screen" style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }} />
      </div>
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: "easeOut" }} className="flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-subtle text-primary text-[13px] font-bold tracking-wide uppercase mb-6">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>
              Support & FAQs
            </div>
            <h2 className="text-[2.5rem] lg:text-[3rem] font-extrabold tracking-tight leading-[1.1] mb-6" style={{ color: "var(--fg)" }}>
              Got Questions? <span className="text-primary">We've Got Answers.</span>
            </h2>
            <p className="text-[16px] max-w-2xl leading-relaxed mb-8" style={{ color: "var(--fg-muted)" }}>
              Everything you need to know about purchasing, accessing, and learning from our recorded courses. If you can't find your answer here, feel free to <Link to="/contact" className="text-primary hover:underline">contact our support team</Link>.
            </p>
          </motion.div>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto w-full">
          {faqs.map(([q, a], idx) => {
            const isOpen = openIdx === idx;
            return (
              <motion.div
                key={q}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: "easeOut" }}
                className="rounded-2xl overflow-hidden transition-all duration-300 relative group"
                style={{ border: "1px solid", borderColor: isOpen ? "var(--primary)" : "var(--border)", background: isOpen ? "var(--surface2)" : "rgba(15, 17, 23, 0.4)", backdropFilter: "blur(12px)", boxShadow: isOpen ? "0 10px 30px -10px rgba(0,0,0,0.3)" : "none" }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 2%, transparent), transparent)" }} />
                <button onClick={() => setOpenIdx(isOpen ? null : idx)} className="w-full px-6 py-6 flex items-start justify-between text-left focus:outline-none relative z-10">
                  <span className="font-bold text-[16px] leading-snug pr-8" style={{ color: isOpen ? "var(--fg)" : "var(--fg-muted)" }}>{q}</span>
                  <span className={`shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? "bg-primary text-bg" : "bg-primary-subtle text-primary"}`} style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    {isOpen ? <Minus size={15} strokeWidth={2.5} /> : <Plus size={15} strokeWidth={2.5} />}
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden relative z-10">
                      <div className="px-6 pb-6 pt-0 text-[15px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>{a}</div>
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
    <section className="py-24 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-[20%] w-[500px] h-[500px] rounded-full opacity-[0.05] mix-blend-screen" style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-[20%] w-[500px] h-[500px] rounded-full opacity-[0.05] mix-blend-screen" style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }} />
      </div>
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-[3rem] font-extrabold tracking-tight leading-[1.1] mb-6" style={{ color: "var(--fg)" }}>Start Your Learning <br className="hidden sm:block" /> Journey Today</h2>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-10 leading-relaxed">Join learners building practical skills through structured courses and real-world projects.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search" className={buttonClass("primary", "lg") + " font-bold text-[15px] shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_30%,transparent)] group"}>
              Explore Courses <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/register" className={buttonClass("outline", "lg") + " font-bold text-[15px]"}>Create Free Account</Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function HomeTrustSections() {
  return (
    <>
      <CertificateShowcaseSection />
      <FAQSection />
      <FinalCTASection />
    </>
  );
}
