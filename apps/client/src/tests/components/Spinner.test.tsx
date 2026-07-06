import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Spinner, PageLoader } from '../../components/ui/Spinner';

describe('Spinner Components', () => {
  describe('Spinner', () => {
    it('should render correctly', () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.className.baseVal).toContain('animate-spin');
    });

    it('should accept size and custom classes', () => {
      const { container } = render(<Spinner size={40} className="my-spin" />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('40');
      expect(svg?.getAttribute('height')).toBe('40');
      expect(svg?.className.baseVal).toContain('my-spin');
    });
  });

  describe('PageLoader', () => {
    it('should render centered spinner', () => {
      const { container } = render(<PageLoader />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('flex items-center justify-center');
      expect(wrapper.querySelector('svg')).toBeInTheDocument();
    });
  });
});
