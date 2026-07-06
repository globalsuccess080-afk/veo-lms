import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MyCoursesPage } from '../../pages/student/MyCoursesPage';
import { useQuery } from '@tanstack/react-query';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

describe('MyCoursesPage (Student)', () => {
  it('should render enrolled courses and handle filtering', async () => {
    (useQuery as any).mockReturnValue({
      data: [
        {
          id: 'enr1',
          progress: 100,
          course: { title: 'Completed Course', slug: 'completed-course', thumbnail: '', totalLessons: 5, instructor: { name: 'Teacher A' } }
        },
        {
          id: 'enr2',
          progress: 50,
          course: { title: 'In Progress Course', slug: 'in-progress-course', thumbnail: '', totalLessons: 10, instructor: { name: 'Teacher B' } }
        }
      ],
      isLoading: false
    });

    render(
      <BrowserRouter>
        <MyCoursesPage />
      </BrowserRouter>
    );

    // Initial render shows all courses
    expect(screen.getByText('Completed Course')).toBeInTheDocument();
    expect(screen.getByText('In Progress Course')).toBeInTheDocument();

    // Click 'Completed' filter
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
    await waitFor(() => {
      expect(screen.queryByText('In Progress Course')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Completed Course').length).toBeGreaterThan(0);

    // Click 'In Progress' filter
    fireEvent.click(screen.getByRole('button', { name: 'In Progress' }));
    await waitFor(() => {
      expect(screen.queryByText('Completed Course')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('In Progress Course').length).toBeGreaterThan(0);
  });
});
