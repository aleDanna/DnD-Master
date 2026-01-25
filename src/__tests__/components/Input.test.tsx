import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('associates label with input', () => {
    render(<Input label="Email" id="email-input" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies error styles when error is present', () => {
    render(<Input error="Error" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('sets aria-invalid when error is present', () => {
    render(<Input error="Error" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('displays helper text', () => {
    render(<Input helperText="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('does not display helper text when error is present', () => {
    render(<Input error="Error" helperText="Helper text" />);
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('renders left icon', () => {
    render(<Input leftIcon={<span data-testid="left-icon">L</span>} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    render(<Input rightIcon={<span data-testid="right-icon">R</span>} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies padding for left icon', () => {
    render(<Input leftIcon={<span>L</span>} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pl-10');
  });

  it('applies padding for right icon', () => {
    render(<Input rightIcon={<span>R</span>} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pr-10');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders with different types', () => {
    render(<Input type="password" />);
    expect(screen.getByRole('textbox', { hidden: true })).toHaveAttribute(
      'type',
      'password'
    );
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
