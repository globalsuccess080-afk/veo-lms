import { Types } from 'mongoose'
import { ICourseSection } from '../modules/course/course.model'

export function findSection(sections: ICourseSection[], sectionId: string) {
  return sections.find(s => s._id.toString() === sectionId)
}

export function removeSection(sections: ICourseSection[], sectionId: string) {
  const idx = sections.findIndex(s => s._id.toString() === sectionId)
  if (idx === -1) return null
  return sections.splice(idx, 1)[0]
}
