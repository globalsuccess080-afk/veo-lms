import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { ProfilePage } from '../../pages/student/ProfilePage';
import { useAuthStore } from '../../store/authStore';

import { BrowserRouter } from 'react-router-dom';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('ProfilePage (Student)', () => {
  it('should render user details and allow typing new name', () => {
    (useQuery as any).mockReturnValue({ data: null, isLoading: false });
    (useAuthStore as any).mockReturnValue({
      user: { name: 'Bob Student', email: 'bob@example.com', role: 'student' },
      setAuth: vi.fn()
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    // Displayed name in hero section
    expect(screen.getAllByText('Bob Student').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('bob@example.com')).toBeDisabled();

    const nameInput = screen.getByDisplayValue('Bob Student') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Bobby Student' } });
    expect(nameInput.value).toBe('Bobby Student');
  });
});
