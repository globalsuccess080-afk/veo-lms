import { useQuery } from "@tanstack/react-query";
import { getFeatured } from "../../../services/course.service";
import { CourseCard, CourseCardSkeleton } from "../../../components/course/CourseCard";
import { SectionHeader } from "./HomeSectionHeader";

export default function HomeFeaturedCoursesSection() {
  const { data: featured, isLoading } = useQuery({
    queryKey: ["featured"],
    queryFn: getFeatured,
  });

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "var(--bg)" }}>
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
            ? Array.from({ length: 4 }).map((_, i) => <CourseCardSkeleton key={i} />)
            : featured?.slice(0, 4).map((course) => <CourseCard key={course.id} course={course} />)}
        </div>
      </div>
    </section>
  );
}
