import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ManageCoursesPage } from '../../pages/admin/ManageCoursesPage';
import { useQuery } from '@tanstack/react-query';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));

describe('ManageCoursesPage (Admin)', () => {
  it('should render courses table correctly', () => {
    (useQuery as any).mockReturnValue({
      data: {
        courses: [
          {
            id: 'c1',
            title: 'Mastering React',
            slug: 'mastering-react',
            price: 2000,
            totalLessons: 20,
            enrollmentCount: 50,
            isPublished: true,
            thumbnail: ''
          }
        ],
        meta: { total: 1, totalPages: 1 }
      },
      isLoading: false
    });

    render(
      <BrowserRouter>
        <ManageCoursesPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Mastering React')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    // Price checks
    expect(screen.getByText(/₹2,000/)).toBeInTheDocument();
  });
});
