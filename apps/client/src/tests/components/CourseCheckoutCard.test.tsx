import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CourseCheckoutCard } from '../../components/course-page/CourseCheckoutCard';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('CourseCheckoutCard', () => {
  const mockCourse: any = {
    id: 'c1',
    title: 'Test Course',
    price: 999,
    originalPrice: 1999,
    totalLessons: 10,
    totalDuration: 3600,
    level: 'Beginner',
    trailerUrl: '',
    thumbnail: ''
  };

  it('should render course price and discount', () => {
    render(
      <BrowserRouter>
        <CourseCheckoutCard 
          course={mockCourse} 
          isEnrolled={false} 
          isLoggedIn={true} 
          paying={false} 
          onEnroll={vi.fn()} 
        />
      </BrowserRouter>
    );

    // Expect formatted INR value for 999 -> ₹999
    expect(screen.getByText(/₹999/)).toBeInTheDocument();
    // Expect original price
    expect(screen.getByText(/₹1,999/)).toBeInTheDocument();
    // Features check
    expect(screen.getByText('10 On-Demand Lessons')).toBeInTheDocument();
  });

  it('should show Continue Learning if enrolled', () => {
    render(
      <BrowserRouter>
        <CourseCheckoutCard 
          course={mockCourse} 
          isEnrolled={true} 
          isLoggedIn={true} 
          paying={false} 
          onEnroll={vi.fn()} 
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Continue Learning')).toBeInTheDocument();
  });

  it('should show Login to Enroll if not logged in', () => {
    render(
      <BrowserRouter>
        <CourseCheckoutCard 
          course={mockCourse} 
          isEnrolled={false} 
          isLoggedIn={false} 
          paying={false} 
          onEnroll={vi.fn()} 
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Login to Enroll')).toBeInTheDocument();
  });
});
