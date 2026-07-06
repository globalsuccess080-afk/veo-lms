import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';

// Simple mock for testing structure. You'd normally import your real ProtectedRoute.
const MockProtectedRoute = ({ isAuthenticated, children }: any) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const MockLogin = () => <div>Login Page</div>;
const MockDashboard = () => <div>Dashboard Page</div>;

describe('ProtectedRoute', () => {
  it('should redirect a guest user to login', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<MockLogin />} />
          <Route 
            path="/dashboard" 
            element={
              <MockProtectedRoute isAuthenticated={false}>
                <MockDashboard />
              </MockProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should render children for a logged-in user', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<MockLogin />} />
          <Route 
            path="/dashboard" 
            element={
              <MockProtectedRoute isAuthenticated={true}>
                <MockDashboard />
              </MockProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });
});
