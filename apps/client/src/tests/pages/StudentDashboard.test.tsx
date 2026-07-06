import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../../pages/student/DashboardPage';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData: vi.fn() })
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('Student DashboardPage', () => {
  it('should render the student dashboard with stats and courses', () => {
    (useAuthStore as any).mockReturnValue({ name: 'John Doe' });
    
    (useQuery as any).mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'my-enrollments') {
        return {
          data: [
            {
              id: 'enr1',
              progress: 50,
              course: { title: 'React Basics', slug: 'react-basics', thumbnail: '', totalLessons: 10, instructor: { name: 'Jane' } }
            }
          ],
          isLoading: false
        };
      }
      if (queryKey[0] === 'recent-progress') {
        return {
          data: [],
          isLoading: false
        };
      }
      return { data: null, isLoading: false };
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Ready to learn/i)).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('React Basics')).toBeInTheDocument();
  });
});
