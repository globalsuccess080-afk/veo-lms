import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage';
import { useQuery } from '@tanstack/react-query';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

describe('AdminDashboardPage', () => {
  it('should render loading skeleton initially', () => {
    (useQuery as any).mockReturnValue({ isLoading: true });
    render(
      <BrowserRouter>
        <AdminDashboardPage />
      </BrowserRouter>
    );
    // The skeleton has a specific structure or test ID, but we can check if Dashboard isn't loaded fully
    expect(screen.queryByText('Total Courses')).not.toBeInTheDocument();
  });

  it('should render stats correctly when data is loaded', () => {
    (useQuery as any).mockReturnValue({
      data: {
        totalCourses: 25,
        totalStudents: 150,
        totalEnrollments: 200,
        totalRevenue: 500000, // 5000 INR
        recentEnrollments: []
      },
      isLoading: false,
    });

    render(
      <BrowserRouter>
        <AdminDashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Total Courses')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    // Revenue formatted value
    expect(screen.getByText(/₹5,000/)).toBeInTheDocument();
  });
});
