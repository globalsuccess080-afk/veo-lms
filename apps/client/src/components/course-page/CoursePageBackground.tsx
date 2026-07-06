
export function CoursePageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>

      {/* Scattered Subtle Glows */}
      <div 
        className="absolute top-[35%] -left-[5vw] w-[25vw] h-[25vw] rounded-full blur-[80px] pointer-events-none" 
        style={{ backgroundColor: 'var(--primary)', opacity: 0.08 }} 
      />
      <div 
        className="absolute bottom-[10%] right-[2vw] w-[30vw] h-[30vw] rounded-[100%] blur-[90px] pointer-events-none" 
        style={{ backgroundColor: 'var(--primary)', opacity: 0.10 }} 
      />

      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.03 }}
      >
        <defs>
          <pattern id="cp-grid" x="0" y="0" width="72" height="72" patternUnits="userSpaceOnUse">
            <path d="M 72 0 L 0 0 0 72" fill="none" stroke="var(--primary)" strokeWidth="0.45" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cp-grid)" />
      </svg>

      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.03 * 1.4 }}
      >
        <defs>
          <pattern id="cp-cross" x="0" y="0" width="72" height="72" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="1.2" fill="var(--primary)" />
            <path d="M -4 0 L 4 0 M 0 -4 L 0 4" stroke="var(--primary)" strokeWidth="0.4" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cp-cross)" />
      </svg>



      <div
        className="absolute top-[18%] right-[12%] w-2 h-2 rounded-full"
        style={{
          background: 'var(--primary)',
          boxShadow: '0 0 20px color-mix(in srgb, var(--primary) 60%, transparent)',
          opacity: 0.35
        }}
      />
      <div
        className="absolute top-[42%] left-[8%] w-1.5 h-1.5 rounded-full"
        style={{
          background: 'var(--primary)',
          boxShadow: '0 0 14px color-mix(in srgb, var(--primary) 50%, transparent)',
          opacity: 0.25
        }}
      />
    </div>
  )
}
