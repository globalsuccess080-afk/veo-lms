import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { User } from '../modules/user/user.model'
import { Course } from '../modules/course/course.model'
import { Lesson } from '../modules/lesson/lesson.model'
import { Types } from 'mongoose'
import { hashPassword } from '../utils/password'

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

const courses = [
  {
    title: 'HTML Fundamentals',
    description: 'Learn the building blocks of the web with HTML5. Master semantic markup, forms, tables, and accessibility.',
    shortDescription: 'Master HTML5 from scratch with hands-on projects',
    category: 'HTML',
    tags: ['html', 'web', 'beginner'],
    level: 'beginner',
    price: 499,
    originalPrice: 999,
    isFeatured: true,
    isPublished: true,
    instructor: { name: 'Pro Codrr', bio: 'Full-stack educator', avatar: '' },
    thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800',
    trailerUrl: 'https://www.youtube.com/embed/dD2EISBDjHM',
    sections: [
      { title: 'Getting Started', order: 0, lessons: [
        { title: 'What is HTML?', youtube: 'dD2EISBDjHM', duration: 600, isPreview: true, order: 0 },
        { title: 'HTML Document Structure', youtube: 'wvRwh5l0Y5E', duration: 720, isPreview: true, order: 1 },
        { title: 'Text Elements', youtube: 'P5USXzqM0hU', duration: 540, order: 2 }
      ]},
      { title: 'Elements & Attributes', order: 1, lessons: [
        { title: 'Links and Images', youtube: 'G3e-cpL7ofc', duration: 660, order: 0 },
        { title: 'Lists and Tables', youtube: 'wXUhTZpF_RQ', duration: 780, order: 1 },
        { title: 'Forms Basics', youtube: 'fNcJuPIZ2WE', duration: 900, order: 2 },
        { title: 'Semantic HTML', youtube: 'kGW8Al_cg4c', duration: 600, order: 3 }
      ]},
      { title: 'Forms & Tables', order: 2, lessons: [
        { title: 'Advanced Forms', youtube: '4q0gYjAVonI', duration: 840, order: 0 },
        { title: 'HTML Best Practices', youtube: 'G1eW3Oi6PJ4', duration: 720, order: 1 }
      ]}
    ]
  },
  {
    title: 'CSS Mastery',
    description: 'From selectors to animations, become a CSS expert. Learn Flexbox, Grid, and modern layout techniques.',
    shortDescription: 'Complete CSS course with Flexbox, Grid, and animations',
    category: 'CSS',
    tags: ['css', 'styling', 'design'],
    level: 'beginner',
    price: 599,
    originalPrice: 1199,
    isFeatured: true,
    isPublished: true,
    instructor: { name: 'Pro Codrr', bio: 'Full-stack educator', avatar: '' },
    thumbnail: 'https://images.unsplash.com/photo-1507723989629-357bfd094c7b?w=800',
    trailerUrl: 'https://www.youtube.com/embed/1Rs2ND1ryYc',
    sections: [
      { title: 'Selectors & Box Model', order: 0, lessons: [
        { title: 'CSS Introduction', youtube: '1Rs2ND1ryYc', duration: 600, isPreview: true, order: 0 },
        { title: 'Selectors Deep Dive', youtube: 'lzCNf_7Oo38', duration: 720, isPreview: true, order: 1 },
        { title: 'Box Model', youtube: 'rIO5326FgPE', duration: 660, order: 2 }
      ]},
      { title: 'Flexbox & Grid', order: 1, lessons: [
        { title: 'Flexbox Layout', youtube: 'JJSoEo8JSnc', duration: 900, order: 0 },
        { title: 'CSS Grid', youtube: 'EiNiSFIPIQE', duration: 840, order: 1 },
        { title: 'Responsive Design', youtube: 'srvUrASNj0s', duration: 780, order: 2 },
        { title: 'Media Queries', youtube: '2KL-z9A56SQ', duration: 600, order: 3 }
      ]},
      { title: 'Animations', order: 2, lessons: [
        { title: 'CSS Transitions', youtube: 'iw0z4Z5qESk', duration: 540, order: 0 },
        { title: 'CSS Animations', youtube: 'YszONjKp55g', duration: 720, order: 1 },
        { title: 'CSS Variables', youtube: 'PHy6nIP6Kng', duration: 600, order: 2 }
      ]}
    ]
  },
  {
    title: 'JavaScript Essentials',
    description: 'Master JavaScript from variables to async programming. Build real projects and understand the language deeply.',
    shortDescription: 'Complete JavaScript course for web developers',
    category: 'JavaScript',
    tags: ['javascript', 'programming', 'web'],
    level: 'intermediate',
    price: 799,
    originalPrice: 1499,
    isFeatured: true,
    isPublished: true,
    instructor: { name: 'Pro Codrr', bio: 'Full-stack educator', avatar: '' },
    thumbnail: 'https://images.unsplash.com/photo-1627393853336-0e3baf772d8d?w=800',
    trailerUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk',
    sections: [
      { title: 'Basics', order: 0, lessons: [
        { title: 'JS Introduction', youtube: 'W6NZfCO5SIk', duration: 720, isPreview: true, order: 0 },
        { title: 'Variables & Data Types', youtube: 'IsG4Xd6LlsM', duration: 660, isPreview: true, order: 1 },
        { title: 'Operators', youtube: 'r9vC5maKbOM', duration: 540, order: 2 },
        { title: 'Control Flow', youtube: 'IsG4Xd6LlsM', duration: 780, order: 3 }
      ]},
      { title: 'Functions & Closures', order: 1, lessons: [
        { title: 'Functions', youtube: 'N8ap4k_4QHI', duration: 840, order: 0 },
        { title: 'Arrow Functions', youtube: 'h33SjiDfpso', duration: 600, order: 1 },
        { title: 'Closures', youtube: '3a0I8ICR1Vg', duration: 720, order: 2 },
        { title: 'Scope', youtube: 'lW_erSjyMeM', duration: 660, order: 3 }
      ]},
      { title: 'Async JS', order: 2, lessons: [
        { title: 'Callbacks', youtube: 'PoRJizFvM7o', duration: 600, order: 0 },
        { title: 'Promises', youtube: 'DHvZLI7Db8E', duration: 780, order: 1 },
        { title: 'Async/Await', youtube: 'V_2-mjfMemc', duration: 720, order: 2 },
        { title: 'Fetch API', youtube: 'cKMUn3INjCA', duration: 660, order: 3 }
      ]}
    ]
  },
  {
    title: 'React from Zero',
    description: 'Build modern web apps with React. Learn components, hooks, context, and routing.',
    shortDescription: 'Learn React 19 with hooks, context, and routing',
    category: 'React',
    tags: ['react', 'frontend', 'javascript'],
    level: 'intermediate',
    price: 999,
    originalPrice: 1999,
    isFeatured: true,
    isPublished: true,
    instructor: { name: 'Pro Codrr', bio: 'Full-stack educator', avatar: '' },
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    trailerUrl: 'https://www.youtube.com/embed/SqcY0GlETPk',
    sections: [
      { title: 'JSX & Components', order: 0, lessons: [
        { title: 'React Introduction', youtube: 'SqcY0GlETPk', duration: 720, isPreview: true, order: 0 },
        { title: 'JSX Basics', youtube: '7fPXI_MnBOY', duration: 660, isPreview: true, order: 1 },
        { title: 'Components', youtube: 'Rh3tobq7bEk', duration: 780, order: 2 },
        { title: 'Props', youtube: 'IYvD9oBCuJI', duration: 600, order: 3 }
      ]},
      { title: 'State & Hooks', order: 1, lessons: [
        { title: 'useState Hook', youtube: 'O6P86uwfdR0', duration: 840, order: 0 },
        { title: 'useEffect Hook', youtube: '0ZJgIjIuY7U', duration: 900, order: 1 },
        { title: 'useRef Hook', youtube: 't2ypzz6gJm0', duration: 540, order: 2 },
        { title: 'Custom Hooks', youtube: '6ThXsUwLWvc', duration: 720, order: 3 }
      ]},
      { title: 'Context & Routing', order: 2, lessons: [
        { title: 'Context API', youtube: '5LrDIWkK_Bc', duration: 780, order: 0 },
        { title: 'React Router', youtube: 'Ul3y4RZwMWY', duration: 840, order: 1 },
        { title: 'Protected Routes', youtube: '2DO3gCq3cu0', duration: 600, order: 2 },
        { title: 'Building a Project', youtube: 'DLX62G4lc44', duration: 1200, order: 3 }
      ]}
    ]
  }
]

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/veolms'
  await mongoose.connect(uri)
  console.log('Connected to MongoDB')

  await User.deleteMany({})
  await Course.deleteMany({})
  await Lesson.deleteMany({})

  const adminPass = await hashPassword(process.env.ADMIN_PASSWORD || 'Admin@123456')
  const studentPass = await hashPassword('Student@123456')

  await User.create({
    name: 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@veolms.com',
    password: adminPass,
    role: 'admin'
  })

  await User.create({
    name: 'Demo Student',
    email: 'student@veolms.com',
    password: studentPass,
    role: 'student'
  })

  console.log('Users created')

  for (const courseData of courses) {
    const slug = slugify(courseData.title)
    const sections = courseData.sections.map(s => ({
      _id: new Types.ObjectId(),
      title: s.title,
      order: s.order,
      lessons: [] as Types.ObjectId[]
    }))

    const course = await Course.create({
      title: courseData.title,
      slug,
      description: courseData.description,
      shortDescription: courseData.shortDescription,
      thumbnail: courseData.thumbnail,
      trailerUrl: courseData.trailerUrl,
      instructor: courseData.instructor,
      price: courseData.price,
      originalPrice: courseData.originalPrice,
      category: courseData.category,
      tags: courseData.tags,
      level: courseData.level,
      isPublished: courseData.isPublished,
      isFeatured: courseData.isFeatured,
      sections
    })

    let totalLessons = 0
    let totalDuration = 0

    for (let i = 0; i < courseData.sections.length; i++) {
      const sectionData = courseData.sections[i]
      const section = course.sections[i]

      for (const lessonData of sectionData.lessons) {
        const lesson = await Lesson.create({
          courseId: course._id,
          sectionId: section._id,
          title: lessonData.title,
          order: lessonData.order,
          duration: lessonData.duration,
          isPreview: lessonData.isPreview || false,
          video: {
            status: 'ready',
            youtubeUrl: `https://www.youtube.com/embed/${lessonData.youtube}`
          }
        })
        section.lessons.push(lesson._id)
        totalLessons++
        totalDuration += lessonData.duration
      }
    }

    course.totalLessons = totalLessons
    course.totalDuration = totalDuration
    await course.save()
    console.log(`Created course: ${course.title} (${totalLessons} lessons)`)
  }

  console.log('\nSeed complete!')
  console.log('Admin: admin@veolms.com / Admin@123456')
  console.log('Student: student@veolms.com / Student@123456')
  await mongoose.disconnect()
}

seed().catch(console.error)
