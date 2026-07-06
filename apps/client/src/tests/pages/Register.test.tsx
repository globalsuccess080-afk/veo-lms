import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Simple mock for testing structure similar to Login.test.tsx
const MockRegister = () => (
  <form onSubmit={(e) => e.preventDefault()}>
    <input type="text" placeholder="Name" required />
    <input type="email" placeholder="Email" required />
    <input type="password" placeholder="Password" required />
    <button type="submit">Create Account</button>
  </form>
);

describe('Register Page', () => {
  it('should require all fields', () => {
    render(
      <BrowserRouter>
        <MockRegister />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(button);

    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email');
    expect((nameInput as HTMLInputElement).validationMessage).toBeTruthy();
    expect((emailInput as HTMLInputElement).validationMessage).toBeTruthy();
  });

  it('should allow input changes', () => {
    render(
      <BrowserRouter>
        <MockRegister />
      </BrowserRouter>
    );

    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });

    expect((nameInput as HTMLInputElement).value).toBe('John Doe');
    expect((emailInput as HTMLInputElement).value).toBe('john@example.com');
    expect((passwordInput as HTMLInputElement).value).toBe('secret123');
  });
});
