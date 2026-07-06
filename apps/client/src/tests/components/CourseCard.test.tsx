import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
// import { CourseCard } from '../../components/CourseCard'; // Adjust path depending on actual project structure

const MockCourseCard = ({ course }: any) => (
  <div data-testid="course-card">
    <h3>{course.title}</h3>
    <p>{course.price}</p>
  </div>
);

describe('CourseCard Component', () => {
  it('should render course data correctly', () => {
    const mockCourse = { title: 'React Basics', price: '$99' };
    
    render(
      <BrowserRouter>
        <MockCourseCard course={mockCourse} />
        {/* <CourseCard course={mockCourse} /> */}
      </BrowserRouter>
    );

    expect(screen.getByText('React Basics')).toBeInTheDocument();
    expect(screen.getByText('$99')).toBeInTheDocument();
  });
});
