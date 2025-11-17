import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock dependencies
vi.mock('antd', () => ({
  Button: ({
    children,
    type,
    loading,
    size,
    disabled,
    onClick,
    htmlType,
    danger,
    ghost,
    icon,
    shape,
    block,
    className,
    style,
    ...restProps
  }: any) => (
    <button
      data-testid="ant-button"
      data-type={type}
      data-loading={loading}
      data-size={size}
      data-disabled={disabled}
      data-htmltype={htmlType}
      data-danger={danger}
      data-ghost={ghost}
      data-shape={shape}
      data-block={block}
      data-classname={className}
      style={style}
      onClick={disabled ? undefined : onClick}
      {...restProps}
    >
      {icon && <span data-testid="button-icon">{icon}</span>}
      {children}
    </button>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Import the component after mocking
import { Button } from '../index';

describe('Button Component', () => {
  describe('Button Types', () => {
    it('should render primary button with correct styles', () => {
      render(<Button type="primary">Primary Button</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Primary Button');
      // Check that the button has primary type
      expect(button).toHaveAttribute('data-type', 'primary');
    });

    it('should render secondary button with correct styles', () => {
      render(<Button type="secondary">Secondary Button</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Secondary Button');
      // Check that the button has default type (secondary is mapped to default in Ant Design)
      expect(button).toHaveAttribute('data-type', 'default');
    });

    it('should default to secondary type', () => {
      render(<Button>Default Button</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Default Button');
      // Check that the button defaults to default type
      expect(button).toHaveAttribute('data-type', 'default');
    });
  });

  describe('Button States', () => {
    it('should render loading state', () => {
      render(<Button loading>Loading Button</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-loading', 'true');
    });

    it('should render disabled state', () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-disabled', 'true');
    });

    it('should render danger button', () => {
      render(<Button danger>Danger Button</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-danger', 'true');
    });

    it('should render ghost button', () => {
      render(<Button ghost>Ghost Button</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-ghost', 'true');
    });
  });

  describe('Button Sizes', () => {
    it('should render small size', () => {
      render(<Button size="small">Small Button</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-size', 'small');
    });

    it('should render middle size', () => {
      render(<Button size="middle">Middle Button</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-size', 'middle');
    });

    it('should render large size', () => {
      render(<Button size="large">Large Button</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-size', 'large');
    });
  });

  describe('Button Shapes', () => {
    it('should render default shape', () => {
      render(<Button shape="default">Default Shape</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-shape', 'default');
    });

    it('should render circle shape', () => {
      render(<Button shape="circle">Circle Shape</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-shape', 'circle');
    });

    it('should render round shape', () => {
      render(<Button shape="round">Round Shape</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-shape', 'round');
    });
  });

  describe('Button Interactions', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByTestId('ant-button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled Button
        </Button>,
      );

      const button = screen.getByTestId('ant-button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('HTML Types', () => {
    it('should render button type', () => {
      render(<Button htmlType="button">Button Type</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-htmltype', 'button');
    });

    it('should render submit type', () => {
      render(<Button htmlType="submit">Submit Type</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-htmltype', 'submit');
    });

    it('should render reset type', () => {
      render(<Button htmlType="reset">Reset Type</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-htmltype', 'reset');
    });
  });

  describe('Additional Features', () => {
    it('should render with icon', () => {
      render(<Button icon={<span>🔍</span>}>Search</Button>);

      const button = screen.getByTestId('ant-button');
      const icon = screen.getByTestId('button-icon');

      expect(button).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('🔍');
    });

    it('should render block button', () => {
      render(<Button block>Block Button</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-block', 'true');
    });

    it('should support custom className', () => {
      render(<Button className="custom-class">Custom Class Button</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      const classNameAttr = button.getAttribute('data-classname');
      expect(classNameAttr).toContain('custom-class');
    });

    it('should pass through additional props', () => {
      render(
        <Button data-test="extra-prop" aria-label="test-label">
          Extra Props
        </Button>,
      );

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-test', 'extra-prop');
      expect(button).toHaveAttribute('aria-label', 'test-label');
    });
  });

  describe('Style Logic', () => {
    it('should override styles for danger buttons', () => {
      render(
        <Button type="primary" danger>
          Danger Primary
        </Button>,
      );

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      // Danger buttons should have the danger attribute
      expect(button).toHaveAttribute('data-danger', 'true');
      expect(button).toHaveAttribute('data-type', 'primary');
    });

    it('should map types to Ant Design types correctly', () => {
      const { rerender } = render(<Button type="primary">Primary</Button>);
      let button = screen.getByTestId('ant-button');
      expect(button).toHaveAttribute('data-type', 'primary');

      rerender(<Button type="secondary">Secondary</Button>);
      button = screen.getByTestId('ant-button');
      expect(button).toHaveAttribute('data-type', 'default');

      rerender(<Button danger>Danger</Button>);
      button = screen.getByTestId('ant-button');
      expect(button).toHaveAttribute('data-type', 'primary');
    });
  });

  describe('Danger Button States', () => {
    it('should render danger button in default state', () => {
      render(<Button danger>Delete</Button>);

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-danger', 'true');
      expect(button).toHaveTextContent('Delete');
    });

    it('should render danger button in disabled state', () => {
      render(
        <Button danger disabled>
          Delete
        </Button>,
      );

      const button = screen.getByTestId('ant-button');

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-danger', 'true');
      expect(button).toHaveAttribute('data-disabled', 'true');
    });

    it('should not trigger onClick when danger button is disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button danger disabled onClick={handleClick}>
          Delete
        </Button>,
      );

      const button = screen.getByTestId('ant-button');
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should trigger onClick when danger button is enabled', () => {
      const handleClick = vi.fn();
      render(
        <Button danger onClick={handleClick}>
          Delete
        </Button>,
      );

      const button = screen.getByTestId('ant-button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
