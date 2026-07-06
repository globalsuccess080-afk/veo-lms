import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../components/ui/Badge';

describe('Badge Component', () => {
  it('should render correctly with default props', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-surface2'); // Default tone is neutral
  });

  it('should render with primary tone', () => {
    render(<Badge tone="primary">Primary</Badge>);
    const badge = screen.getByText('Primary');
    expect(badge.className).toContain('bg-primary-subtle');
    expect(badge.className).toContain('text-primary');
  });

  it('should render with success tone', () => {
    render(<Badge tone="success">Success</Badge>);
    const badge = screen.getByText('Success');
    expect(badge.className).toContain('bg-success/15');
    expect(badge.className).toContain('text-success');
  });

  it('should apply custom className', () => {
    render(<Badge className="extra-class">Custom Badge</Badge>);
    const badge = screen.getByText('Custom Badge');
    expect(badge.className).toContain('extra-class');
  });
});
