import { lazy, Suspense, useEffect, useState } from "react";

const HomeFeaturedCoursesSection = lazy(() => import("./HomeFeaturedCoursesSection"));
const HomeSkillsWhySection = lazy(() => import("./HomeSkillsWhySection"));
const HomeTrustSections = lazy(() => import("./HomeTrustSections"));

function scheduleIdle(callback: () => void, timeout: number) {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = globalThis.setTimeout(callback, Math.min(timeout, 250));
  return () => globalThis.clearTimeout(id);
}

export default function HomeDeferredSections() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const cleanups = [
      scheduleIdle(() => setStage((current) => Math.max(current, 1)), 250),
      scheduleIdle(() => setStage((current) => Math.max(current, 2)), 900),
      scheduleIdle(() => setStage((current) => Math.max(current, 3)), 1500),
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <>
      {stage >= 1 && (
        <Suspense fallback={null}>
          <HomeFeaturedCoursesSection />
        </Suspense>
      )}
      {stage >= 2 && (
        <Suspense fallback={null}>
          <HomeSkillsWhySection />
        </Suspense>
      )}
      {stage >= 3 && (
        <Suspense fallback={null}>
          <HomeTrustSections />
        </Suspense>
      )}
    </>
  );
}
