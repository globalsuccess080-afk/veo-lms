import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input, Textarea, Field } from '../../components/ui/Input';

describe('Input Components', () => {
  describe('Input', () => {
    it('should render properly and accept input', () => {
      const handleChange = vi.fn();
      render(<Input placeholder="Enter text" onChange={handleChange} />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
      
      fireEvent.change(input, { target: { value: 'hello' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('should show error styles when error prop is provided', () => {
      render(<Input placeholder="Error input" error="Invalid field" />);
      const input = screen.getByPlaceholderText('Error input');
      expect(input.className).toContain('border-danger');
    });
  });

  describe('Textarea', () => {
    it('should render properly', () => {
      render(<Textarea placeholder="Enter description" />);
      const textarea = screen.getByPlaceholderText('Enter description');
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });
  });

  describe('Field', () => {
    it('should render label and error message', () => {
      render(
        <Field label="Username" error="Username is required">
          <Input id="username" />
        </Field>
      );
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Username is required')).toBeInTheDocument();
      expect(screen.getByText('Username is required').className).toContain('text-danger');
    });
  });
});
