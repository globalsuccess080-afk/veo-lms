import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCourses, searchCourses, getCategories } from '../../services/course.service'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { CourseCard, CourseCardSkeleton } from '../../components/course/CourseCard'
import { Input } from '../../components/ui/Input'
import { EmptyState } from '../../components/ui/EmptyState'
import { useDebounce } from '../../hooks/useDebounce'
import { cn } from '../../lib/utils'

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVars = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const initialQ = params.get('q') || ''
  const [query, setQuery] = useState(initialQ)
  const debounced = useDebounce(query, 350)

  useEffect(() => {
    if (debounced) setParams({ q: debounced }, { replace: true })
    else setParams({}, { replace: true })
  }, [debounced, setParams])

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  })

  const isSearching = debounced.trim().length > 0
  const isCategory = categories.some((c) => c.toLowerCase() === debounced.trim().toLowerCase())

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchCourses(debounced),
    enabled: isSearching && !isCategory
  })

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['courses', isCategory ? debounced : 'all'],
    queryFn: () => getCourses(1, isCategory ? debounced : undefined),
    enabled: !isSearching || isCategory
  })

  const courses = isSearching && !isCategory ? searchResults || [] : allData?.courses || []
  const loading = isSearching && !isCategory ? searchLoading : allLoading

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 py-10 lg:py-16">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center lg:text-left"
        >
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-3 tracking-tight text-fg">Explore Courses</h1>
          <p className="text-lg text-muted">Find the perfect course to level up your skills</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-2xl mx-auto lg:mx-0 mb-8 group"
        >
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle group-focus-within:text-primary transition-colors" />
          <Input 
            className="pl-12 h-14 text-[15px] bg-surface2/50 border-transparent hover:border-line focus:bg-canvas rounded-2xl shadow-sm transition-all" 
            placeholder="Search for courses, topics, instructors..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            autoFocus 
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2.5 flex-wrap mb-10 justify-center lg:justify-start"
        >
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-muted uppercase tracking-wider mr-2"><SlidersHorizontal size={14} /> Filter:</span>
          <button 
            onClick={() => setQuery('')} 
            className={cn('px-4 py-2 rounded-xl text-[14px] font-bold transition-all shadow-sm', !debounced ? 'bg-primary text-primary-fg' : 'bg-surface/50 border border-line/80 text-muted hover:border-primary/50 hover:text-fg')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setQuery(cat)}
              className={cn('px-4 py-2 rounded-xl text-[14px] font-bold transition-all shadow-sm', debounced.toLowerCase() === cat.toLowerCase() ? 'bg-primary text-primary-fg' : 'bg-surface/50 border border-line/80 text-muted hover:border-primary/50 hover:text-fg')}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <CourseCardSkeleton key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <EmptyState icon={BookOpen} title="No courses found" description={isSearching ? `No results for "${debounced}". Try a different search.` : 'No courses available yet.'} />
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="show" variants={containerVars}>
            <p className="text-[14px] font-semibold text-muted mb-6">{courses.length} course{courses.length !== 1 && 's'} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {courses.map((course) => (
                  <motion.div key={course.id} layout variants={itemVars} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.9 }}>
                    <CourseCard course={course} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
