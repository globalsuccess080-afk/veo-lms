import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LearnPage } from '../../pages/student/LearnPage';
import { useQuery } from '@tanstack/react-query';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useParams: () => ({ courseSlug: 'test-course', lessonId: 'l1' }),
    useNavigate: () => vi.fn()
  };
});

describe('LearnPage', () => {
  it('should render locked state for non-enrolled user', () => {
    (useQuery as any).mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'course') {
        return { data: { id: 'c1', title: 'Test Course', slug: 'test-course' }, isLoading: false };
      }
      if (queryKey[0] === 'curriculum') {
        return { 
          data: { 
            sections: [
              { _id: 's1', title: 'Section 1', lessons: [{ id: 'l1', title: 'Lesson 1', duration: 100, isPreview: false }] }
            ] 
          }, 
          isLoading: false 
        };
      }
      if (queryKey[0] === 'lesson') {
        return { data: { id: 'l1', title: 'Lesson 1', duration: 100, isPreview: false }, isLoading: false };
      }
      if (queryKey[0] === 'my-enrollments') {
        return { data: [], isLoading: false }; // Not enrolled
      }
      return { data: null, isLoading: false };
    });

    render(
      <BrowserRouter>
        <LearnPage />
      </BrowserRouter>
    );

    // Expect the premium content lock screen
    expect(screen.getByText('Unlock Premium Content')).toBeInTheDocument();
    expect(screen.getByText('Purchase Course')).toBeInTheDocument();
  });
});
