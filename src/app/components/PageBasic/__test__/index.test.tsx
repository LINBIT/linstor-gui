// SPDX-License-Identifier: GPL-3.0
//
// Copyright (c) 2024 LINBIT
//
// Author: Liang Li <liang.li@linbit.com>

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PageBasic from '../index';

// Mock all dependencies
vi.mock('@app/NavContext', () => ({
  useNav: () => ({
    isNavOpen: false,
    toggleNav: vi.fn(),
    closeNav: vi.fn(),
    openNav: vi.fn(),
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common:back': 'Back',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock WidthProvider to render children directly
vi.mock('../WidthContext', () => ({
  WidthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('PageBasic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render with title and children', () => {
      render(
        <PageBasic title="Test Page">
          <div>Test Content</div>
        </PageBasic>,
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render as main element with content class', () => {
      render(
        <PageBasic title="Test Page">
          <div>Test Content</div>
        </PageBasic>,
      );

      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass('content');
    });

    it('should render title as h1 with correct classes', () => {
      render(
        <PageBasic title="Test Page">
          <div>Test Content</div>
        </PageBasic>,
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Test Page');
      expect(heading).toHaveClass('text-lg', 'font-semibold');
    });
  });

  describe('back button functionality', () => {
    it('should not show back button by default', () => {
      render(
        <PageBasic title="Test Page">
          <div>Test Content</div>
        </PageBasic>,
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should show back button when showBack is true', () => {
      render(
        <PageBasic title="Test Page" showBack>
          <div>Test Content</div>
        </PageBasic>,
      );

      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
      expect(backButton.textContent).toContain('Back');
      expect(backButton.textContent).toContain('←');
    });

    it('should call navigate(-1) when back button is clicked', () => {
      render(
        <PageBasic title="Test Page" showBack>
          <div>Test Content</div>
        </PageBasic>,
      );

      const backButton = screen.getByRole('button');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('should not show back button when showBack is false', () => {
      render(
        <PageBasic title="Test Page" showBack={false}>
          <div>Test Content</div>
        </PageBasic>,
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('children rendering', () => {
    it('should render multiple children', () => {
      render(
        <PageBasic title="Test Page">
          <div>First Child</div>
          <span>Second Child</span>
          <p>Third Child</p>
        </PageBasic>,
      );

      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
      expect(screen.getByText('Third Child')).toBeInTheDocument();
    });

    it('should render no children gracefully', () => {
      render(<PageBasic title="Test Page" />);

      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      render(
        <PageBasic title="Test Page">
          <div data-testid="complex-child">
            <h2>Nested Title</h2>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </PageBasic>,
      );

      expect(screen.getByTestId('complex-child')).toBeInTheDocument();
      expect(screen.getByText('Nested Title')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('prop handling', () => {
    it('should handle empty title', () => {
      render(
        <PageBasic title="">
          <div>Content</div>
        </PageBasic>,
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('');
    });

    it('should handle special characters in title', () => {
      const specialTitle = 'Test & Page <Title> "Special" Characters';
      render(
        <PageBasic title={specialTitle}>
          <div>Content</div>
        </PageBasic>,
      );

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });

    it('should handle unused props without errors', () => {
      const testAlerts: alertList = [{ title: 'Test Alert', variant: 'info', key: 'test-1' }];

      render(
        <PageBasic title="Test Page" loading={true} error={new Error('Test error')} alerts={testAlerts}>
          <div>Content</div>
        </PageBasic>,
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('layout structure', () => {
    it('should have correct HTML structure', () => {
      render(
        <PageBasic title="Test Page" showBack>
          <div>Content</div>
        </PageBasic>,
      );

      const main = screen.getByRole('main');
      expect(main).toHaveClass('content');

      // Check if header container has correct classes
      const headerDiv = main.querySelector('.flex.items-center.justify-between.pb-4');
      expect(headerDiv).toBeInTheDocument();

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should maintain layout without back button', () => {
      render(
        <PageBasic title="Test Page">
          <div>Content</div>
        </PageBasic>,
      );

      const main = screen.getByRole('main');
      expect(main).toHaveClass('content');

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <PageBasic title="Main Page Title">
          <div>Content</div>
        </PageBasic>,
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Main Page Title');
    });

    it('should have accessible main landmark', () => {
      render(
        <PageBasic title="Test Page">
          <div>Content</div>
        </PageBasic>,
      );

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should have accessible button when present', () => {
      render(
        <PageBasic title="Test Page" showBack>
          <div>Content</div>
        </PageBasic>,
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(/Back/);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple clicks on back button', () => {
      render(
        <PageBasic title="Test Page" showBack>
          <div>Content</div>
        </PageBasic>,
      );

      const backButton = screen.getByRole('button');

      fireEvent.click(backButton);
      fireEvent.click(backButton);
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledTimes(3);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should handle very long titles', () => {
      const longTitle =
        'This is a very long title that might cause layout issues if not handled properly in the component';

      render(
        <PageBasic title={longTitle}>
          <div>Content</div>
        </PageBasic>,
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });
  });
});
