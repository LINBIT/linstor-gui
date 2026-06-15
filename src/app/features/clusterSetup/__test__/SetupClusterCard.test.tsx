import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { SetupClusterCard } from '../components/SetupClusterCard';

describe('SetupClusterCard', () => {
  it('renders the welcome title', () => {
    render(<SetupClusterCard onStart={() => undefined} onDismiss={() => undefined} />);
    expect(screen.getByText(/Welcome — let's set up your LINSTOR cluster/i)).toBeInTheDocument();
  });

  it('calls onStart when Get started is clicked', () => {
    const onStart = vi.fn();
    render(<SetupClusterCard onStart={onStart} onDismiss={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when Dismiss is clicked', () => {
    const onDismiss = vi.fn();
    render(<SetupClusterCard onStart={() => undefined} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
