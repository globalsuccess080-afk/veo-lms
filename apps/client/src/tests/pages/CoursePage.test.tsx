import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CoursePage } from '../../pages/public/CoursePage';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData: vi.fn() })
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../hooks/useRazorpay', () => ({
  useRazorpay: () => ({ initiatePayment: vi.fn(), loading: false })
}));

describe('CoursePage', () => {
  it('should render course not found when no course data', () => {
    (useAuthStore as any).mockReturnValue(null);
    (useQuery as any).mockReturnValue({ data: null, isLoading: false });

    render(
      <BrowserRouter>
        <CoursePage />
      </BrowserRouter>
    );

    expect(screen.getByText('Course not found')).toBeInTheDocument();
  });

  it('should render course details correctly', () => {
    (useAuthStore as any).mockReturnValue(null);
    (useQuery as any).mockImplementation(({ queryKey }: any) => {
      if (queryKey[0] === 'course') {
        return {
          data: {
            id: 'c1',
            title: 'Advanced Typescript',
            description: 'Learn TS',
            slug: 'adv-ts',
            price: 100,
            originalPrice: 200,
            totalLessons: 5,
            instructor: { name: 'Alice', bio: 'Expert', avatar: '' },
            rating: { average: 4.5, count: 10 },
            trailerUrl: 'https://youtube.com/watch?v=123',
            thumbnail: 'thumb.jpg'
          },
          isLoading: false
        };
      }
      if (queryKey[0] === 'curriculum') {
        return { data: { sections: [] }, isLoading: false };
      }
      return { data: null, isLoading: false };
    });

    render(
      <BrowserRouter>
        <CoursePage />
      </BrowserRouter>
    );

    // Test Hero section rendering
    expect(screen.getAllByText('Advanced Typescript').length).toBeGreaterThan(0);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
