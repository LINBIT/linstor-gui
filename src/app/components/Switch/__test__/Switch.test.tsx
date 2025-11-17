import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock dependencies
vi.mock('antd', () => ({
  Switch: ({
    checked,
    disabled,
    loading,
    size,
    onChange,
    onClick,
    checkedChildren,
    unCheckedChildren,
    defaultChecked,
    autoFocus,
    className,
    style,
    ...restProps
  }: any) => (
    <button
      role="switch"
      data-testid="ant-switch"
      data-checked={checked}
      data-disabled={disabled}
      data-loading={loading}
      data-size={size}
      data-defaultchecked={defaultChecked}
      data-autofocus={autoFocus}
      data-classname={className}
      style={style}
      onClick={(e: any) => {
        if (!disabled && !loading) {
          const newChecked = !checked;
          onChange?.(newChecked, e);
          onClick?.(newChecked, e);
        }
      }}
      {...restProps}
    >
      {checked ? checkedChildren : unCheckedChildren}
    </button>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Import the component after mocking
import { Switch } from '../index';

describe('Switch Component', () => {
  describe('Basic Rendering', () => {
    it('should render switch component', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should render with default props', () => {
      render(<Switch />);
      const switchElement = screen.getByTestId('ant-switch');
      expect(switchElement).toHaveAttribute('data-disabled', 'false');
      expect(switchElement).toHaveAttribute('data-loading', 'false');
      expect(switchElement).toHaveAttribute('data-size', 'default');
    });

    it('should render with custom className', () => {
      render(<Switch className="custom-switch" />);
      const switchElement = screen.getByTestId('ant-switch');
      const classNameAttr = switchElement.getAttribute('data-classname');
      expect(classNameAttr).toContain('custom-switch');
    });
  });

  describe('Checked State', () => {
    it('should render with checked state', () => {
      render(<Switch checked={true} />);
      const switchElement = screen.getByTestId('ant-switch');
      expect(switchElement).toHaveAttribute('data-checked', 'true');
    });

    it('should render with unchecked state', () => {
      render(<Switch checked={false} />);
      const switchElement = screen.getByTestId('ant-switch');
      expect(switchElement).toHaveAttribute('data-checked', 'false');
    });

    it('should render with default checked state', () => {
      render(<Switch defaultChecked={true} />);
      const switchElement = screen.getByTestId('ant-switch');
      expect(switchElement).toHaveAttribute('data-defaultchecked', 'true');
    });
  });

  describe('Disabled State', () => {
    it('should render disabled switch', () => {
      render(<Switch disabled={true} />);
      const switchElement = screen.getByTestId('ant-switch');
      expect(switchElement).toHaveAttribute('data-disabled', 'true');
    });

    it('should not trigger onChange when disabled', () => {
      const handleChange = vi.fn();
      render(<Switch disabled={true} onChange={handleChange} />);
      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should render loading switch', () => {
      render(<Switch loading={true} />);
      const switchElement = screen.getByTestId('ant-switch');
      expect(switchElement).toHaveAttribute('data-loading', 'true');
    });

    it('should not trigger onChange when loading', () => {
      const handleChange = vi.fn();
      render(<Switch loading={true} onChange={handleChange} />);
      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Size', () => {
    it('should render with small size', () => {
      render(<Switch size="small" />);
      const switchElement = screen.getByTestId('ant-switch');
      expect(switchElement).toHaveAttribute('data-size', 'small');
    });

    it('should render with default size', () => {
      render(<Switch size="default" />);
      const switchElement = screen.getByTestId('ant-switch');
      expect(switchElement).toHaveAttribute('data-size', 'default');
    });
  });

  describe('Event Handlers', () => {
    it('should call onChange when clicked', () => {
      const handleChange = vi.fn();
      render(<Switch checked={false} onChange={handleChange} />);
      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true, expect.anything());
    });

    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Switch checked={false} onClick={handleClick} />);
      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(true, expect.anything());
    });

    it('should call both onChange and onClick when clicked', () => {
      const handleChange = vi.fn();
      const handleClick = vi.fn();
      render(<Switch checked={false} onChange={handleChange} onClick={handleClick} />);
      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Children Content', () => {
    it('should render checked children when checked', () => {
      render(<Switch checked={true} checkedChildren="ON" unCheckedChildren="OFF" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveTextContent('ON');
    });

    it('should render unchecked children when unchecked', () => {
      render(<Switch checked={false} checkedChildren="ON" unCheckedChildren="OFF" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveTextContent('OFF');
    });

    it('should render with React node as children', () => {
      render(<Switch checked={true} checkedChildren={<span>✓</span>} unCheckedChildren={<span>✗</span>} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toContainHTML('<span>✓</span>');
    });
  });

  describe('Auto Focus', () => {
    it('should render with autoFocus', () => {
      render(<Switch autoFocus={true} />);
      const switchElement = screen.getByTestId('ant-switch');
      expect(switchElement).toHaveAttribute('data-autofocus', 'true');
    });

    it('should render without autoFocus by default', () => {
      render(<Switch />);
      const switchElement = screen.getByTestId('ant-switch');
      expect(switchElement).toHaveAttribute('data-autofocus', 'false');
    });
  });

  describe('Additional Props', () => {
    it('should pass through additional props', () => {
      render(<Switch data-custom="value" aria-label="Test Switch" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-custom', 'value');
      expect(switchElement).toHaveAttribute('aria-label', 'Test Switch');
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('should work as controlled component', () => {
      const { rerender } = render(<Switch checked={false} />);
      let switchElement = screen.getByTestId('ant-switch');
      expect(switchElement).toHaveAttribute('data-checked', 'false');

      rerender(<Switch checked={true} />);
      switchElement = screen.getByTestId('ant-switch');
      expect(switchElement).toHaveAttribute('data-checked', 'true');
    });

    it('should work as uncontrolled component with defaultChecked', () => {
      render(<Switch defaultChecked={true} />);
      const switchElement = screen.getByTestId('ant-switch');
      expect(switchElement).toHaveAttribute('data-defaultchecked', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined checked prop', () => {
      render(<Switch checked={undefined} />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should handle multiple rapid clicks', () => {
      const handleChange = vi.fn();
      render(<Switch checked={false} onChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      fireEvent.click(switchElement);
      fireEvent.click(switchElement);
      fireEvent.click(switchElement);

      expect(handleChange).toHaveBeenCalledTimes(3);
    });

    it('should work with both loading and disabled', () => {
      const handleChange = vi.fn();
      render(<Switch loading={true} disabled={true} onChange={handleChange} />);
      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});
