import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ManageStudentsPage } from '../../pages/admin/ManageStudentsPage';
import { useQuery } from '@tanstack/react-query';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));

describe('ManageStudentsPage (Admin)', () => {
  it('should render students table correctly', () => {
    (useQuery as any).mockReturnValue({
      data: {
        students: [
          {
            id: 's1',
            name: 'Alice Learner',
            email: 'alice@example.com',
            enrollments: 3,
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z'
          }
        ],
        meta: { total: 1, totalPages: 1 }
      },
      isLoading: false
    });

    render(
      <BrowserRouter>
        <ManageStudentsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Alice Learner')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Jan 1, 2026')).toBeInTheDocument();
  });
});
