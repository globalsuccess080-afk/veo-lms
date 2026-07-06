import { Link } from "react-router-dom";
import { Play, Lock, ChevronDown, Clock, FileText } from "lucide-react";
import { useState } from "react";
import { formatDuration, cn } from "../../lib/utils";
import { CoursePanel, SectionEyebrow } from "./CoursePanel";

interface Lesson {
  id: string;
  title: string;
  duration: number;
  isPreview: boolean;
}

interface Section {
  _id: string;
  title: string;
  lessons: Lesson[];
}

interface CourseCurriculumProps {
  sections: Section[];
  courseSlug: string;
  totalLessons: number;
  isEnrolled?: boolean;
}

export function CourseCurriculum({
  sections,
  courseSlug,
  totalLessons,
  isEnrolled,
}: CourseCurriculumProps) {
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(sections.map((s) => s._id)),
  );

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <CoursePanel glow="none">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <SectionEyebrow>Curriculum</SectionEyebrow>
          <h2 className="font-bold text-xl tracking-tight text-fg">
            Course content
          </h2>
        </div>
        <div
          className="cp-badge flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase shrink-0"
          style={{ color: "var(--primary)" }}
        >
          <FileText size={11} />
          {sections.length} sections · {totalLessons} lessons
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section, si) => {
          const isOpen = open.has(section._id);
          const duration = section.lessons.reduce(
            (s, l) => s + (l.duration || 0),
            0,
          );

          return (
            <div
              key={section._id}
              className={cn(
                "bg-black/5 dark:bg-white/5 transition-colors duration-250 rounded-[calc(var(--rad-card)-4px)] overflow-hidden",
              )}
            >
              <button
                type="button"
                onClick={() => toggle(section._id)}
                className="w-full flex items-stretch text-left group"
                style={{ minHeight: 60 }}
              >
                <div
                  className="w-1 shrink-0"
                  style={{
                    background: "var(--primary)",
                    boxShadow:
                      "2px 0 12px color-mix(in srgb, var(--primary) 35%, transparent)",
                  }}
                />

                <div className="bg-transparent  hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200 flex-1 flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-primary/10 shadow-[0_0_14px_-4px_color-mix(in_srgb,var(--primary)_18%,transparent)] w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                      <ChevronDown
                        size={14}
                        className={cn(
                          "text-primary transition-transform duration-300",
                          !isOpen && "-rotate-90",
                        )}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] mb-0.5 text-subtle">
                        Section {String(si + 1).padStart(2, "0")}
                      </p>
                      <p className="font-semibold text-sm truncate leading-tight text-fg">
                        {section.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3 text-xs text-muted">
                    <span>{section.lessons.length} lessons</span>
                    <span className="opacity-30">·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatDuration(duration)}
                    </span>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div>
                  {section.lessons.map((lesson, li) => {
                    const accessible = lesson.isPreview || isEnrolled;

                    const rowContent = (
                      <>
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg grid place-items-center shrink-0",
                              "bg-primary/10 shadow-[0_0_14px_-4px_color-mix(in_srgb,var(--primary)_18%,transparent)]",
                            )}
                          >
                            {accessible ? (
                              <Play
                                size={11}
                                className="text-primary ml-px"
                                fill="var(--primary)"
                              />
                            ) : (
                              <Lock
                                size={11}
                                className="text-subtle"
                                color="var(--fg)"
                              />
                            )}
                          </div>

                          <span
                            className="text-sm truncate leading-snug"
                            style={{
                              color: "var(--fg)",
                            }}
                          >
                            <span className="font-mono text-[11px] mr-1.5 text-subtle">
                              {String(li + 1).padStart(2, "0")}.
                            </span>
                            {lesson.title}
                          </span>

                          {lesson.isPreview && (
                            <span
                              className="bg-primary/10 shrink-0 text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                              style={{ color: "var(--success)" }}
                            >
                              Free
                            </span>
                          )}
                        </div>

                        <span className="flex items-center gap-1 text-[11px] shrink-0 ml-3 font-mono text-subtle">
                          <Clock size={10} />
                          {formatDuration(lesson.duration)}
                        </span>
                      </>
                    );

                    const rowClass =
                      "flex items-center justify-between px-4 py-3 border-t border-primary/6 transition-colors duration-200";

                    if (accessible) {
                      return (
                        <Link
                          key={lesson.id}
                          to={`/learn/${courseSlug}/${lesson.id}`}
                          className={`${rowClass} hover:bg-primary/5`}
                        >
                          {rowContent}
                        </Link>
                      );
                    }

                    return (
                      <div
                        key={lesson.id}
                        className={`${rowClass} opacity-45 cursor-not-allowed`}
                      >
                        {rowContent}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CoursePanel>
  );
}
