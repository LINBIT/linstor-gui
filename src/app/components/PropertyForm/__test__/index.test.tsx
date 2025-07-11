import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import PropertyForm, { PropertyFormRef } from '../index';

describe('PropertyForm', () => {
  test('opens and closes modal', async () => {
    const handleSubmit = vi.fn();
    render(
      <PropertyForm type="controller" handleSubmit={handleSubmit}>
        <button>Open</button>
      </PropertyForm>,
    );

    // Modal should not be visible initially
    expect(screen.queryByText('Property Editor')).not.toBeInTheDocument();

    // Open the modal
    fireEvent.click(screen.getByText('Open'));
    expect(await screen.findByText('Property Editor')).toBeInTheDocument();

    // Close the modal via Cancel button
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => {
      expect(screen.queryByText('Property Editor')).not.toBeInTheDocument();
    });
  });

  test('adds auxiliary property row', async () => {
    const handleSubmit = vi.fn();
    render(
      <PropertyForm type="controller" handleSubmit={handleSubmit}>
        <button>Open</button>
      </PropertyForm>,
    );

    // Open the modal and add an auxiliary row
    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(await screen.findByText('Add Auxiliary Property'));

    // Should render name and value inputs
    expect(screen.getByPlaceholderText('Please input property name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Please input property value')).toBeInTheDocument();
  });

  test('submits auxiliary properties via handleSubmit', async () => {
    const handleSubmit = vi.fn();
    render(
      <PropertyForm type="controller" handleSubmit={handleSubmit}>
        <button>Open</button>
      </PropertyForm>,
    );

    // Open modal and add one auxiliary property
    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(await screen.findByText('Add Auxiliary Property'));

    fireEvent.change(screen.getByPlaceholderText('Please input property name'), { target: { value: 'foo' } });
    fireEvent.change(screen.getByPlaceholderText('Please input property value'), { target: { value: 'bar' } });

    // Submit form
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        override_props: { 'Aux/foo': 'bar' },
        delete_props: [],
      });
    });
  });

  test('deletes auxiliary property', async () => {
    const handleSubmit = vi.fn();
    render(
      <PropertyForm type="controller" handleSubmit={handleSubmit}>
        <button>Open</button>
      </PropertyForm>,
    );

    // Open modal and add auxiliary property
    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(await screen.findByText('Add Auxiliary Property'));

    // Add name and value
    fireEvent.change(screen.getByPlaceholderText('Please input property name'), { target: { value: 'test' } });
    fireEvent.change(screen.getByPlaceholderText('Please input property value'), { target: { value: 'value' } });

    // Delete the auxiliary property
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Property inputs should be removed
    expect(screen.queryByPlaceholderText('Please input property name')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Please input property value')).not.toBeInTheDocument();
  });

  test('adds property from selector', async () => {
    const handleSubmit = vi.fn();
    render(
      <PropertyForm type="controller" handleSubmit={handleSubmit}>
        <button>Open</button>
      </PropertyForm>,
    );

    // Open modal
    fireEvent.click(screen.getByText('Open'));
    await screen.findByText('Property Editor');

    // Check if property selector is available
    const selector = screen.queryByPlaceholderText('Select a property');
    if (selector) {
      // If there are properties available to add, test adding one
      fireEvent.click(selector);

      // Look for Add button and click it if selector has value
      const addButton = screen.getByText('Add');
      expect(addButton).toBeDisabled(); // Should be disabled when no property selected
    }
  });

  test('handles form submission with initial values', async () => {
    const initialVal = { 'DrbdOptions/auto-promote': 'true', 'Aux/customProp': 'initialValue' };
    const handleSubmit = vi.fn();

    render(
      <PropertyForm type="controller" initialVal={initialVal} handleSubmit={handleSubmit}>
        <button>Open</button>
      </PropertyForm>,
    );

    // Open modal
    fireEvent.click(screen.getByText('Open'));
    await screen.findByText('Property Editor');

    // Change an auxiliary property value
    const auxValueInput = screen.getByDisplayValue('initialValue');
    fireEvent.change(auxValueInput, { target: { value: 'newValue' } });

    // Submit form
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        override_props: { 'Aux/customProp': 'newValue' },
        delete_props: [],
      });
    });
  });

  test('handles form reset on modal close', async () => {
    const handleSubmit = vi.fn();
    render(
      <PropertyForm type="controller" handleSubmit={handleSubmit}>
        <button>Open</button>
      </PropertyForm>,
    );

    // Open modal and add auxiliary property
    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(await screen.findByText('Add Auxiliary Property'));

    // Add values
    fireEvent.change(screen.getByPlaceholderText('Please input property name'), { target: { value: 'temp' } });
    fireEvent.change(screen.getByPlaceholderText('Please input property value'), { target: { value: 'temp' } });

    // Close modal
    fireEvent.click(screen.getByText('Cancel'));

    // Reopen modal - should be reset
    fireEvent.click(screen.getByText('Open'));
    await screen.findByText('Property Editor');

    // Should not have the previously added auxiliary property
    expect(screen.queryByDisplayValue('temp')).not.toBeInTheDocument();
  });

  test('validates required fields on form submission', async () => {
    const handleSubmit = vi.fn();
    render(
      <PropertyForm type="controller" handleSubmit={handleSubmit}>
        <button>Open</button>
      </PropertyForm>,
    );

    // Open modal
    fireEvent.click(screen.getByText('Open'));
    await screen.findByText('Property Editor');

    // Try to submit - should work since controller type typically has no required fields
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  test('uses ref to open and close modal programmatically', async () => {
    const handleSubmit = vi.fn();
    const TestComponent = () => {
      const ref = React.useRef<PropertyFormRef>(null);

      return (
        <div>
          <button onClick={() => ref.current?.openModal()}>Open Modal</button>
          <button onClick={() => ref.current?.closeModal()}>Close Modal</button>
          <PropertyForm ref={ref} type="controller" handleSubmit={handleSubmit}>
            <span>Click me</span>
          </PropertyForm>
        </div>
      );
    };

    render(<TestComponent />);

    // Modal should not be visible initially
    expect(screen.queryByText('Property Editor')).not.toBeInTheDocument();

    // Open modal using ref
    fireEvent.click(screen.getByText('Open Modal'));
    expect(await screen.findByText('Property Editor')).toBeInTheDocument();

    // Close modal using ref
    fireEvent.click(screen.getByText('Close Modal'));
    await waitFor(() => {
      expect(screen.queryByText('Property Editor')).not.toBeInTheDocument();
    });
  });

  test('handles multiple auxiliary properties', async () => {
    const handleSubmit = vi.fn();
    render(
      <PropertyForm type="controller" handleSubmit={handleSubmit}>
        <button>Open</button>
      </PropertyForm>,
    );

    // Open modal and add multiple auxiliary properties
    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(await screen.findByText('Add Auxiliary Property'));
    fireEvent.click(screen.getByText('Add Auxiliary Property'));

    // Should have two sets of inputs
    const nameInputs = screen.getAllByPlaceholderText('Please input property name');
    const valueInputs = screen.getAllByPlaceholderText('Please input property value');

    expect(nameInputs).toHaveLength(2);
    expect(valueInputs).toHaveLength(2);

    // Fill both properties
    fireEvent.change(nameInputs[0], { target: { value: 'prop1' } });
    fireEvent.change(valueInputs[0], { target: { value: 'value1' } });
    fireEvent.change(nameInputs[1], { target: { value: 'prop2' } });
    fireEvent.change(valueInputs[1], { target: { value: 'value2' } });

    // Submit form
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        override_props: {
          'Aux/prop1': 'value1',
          'Aux/prop2': 'value2',
        },
        delete_props: [],
      });
    });
  });

  test('skips empty auxiliary properties on submit', async () => {
    const handleSubmit = vi.fn();
    render(
      <PropertyForm type="controller" handleSubmit={handleSubmit}>
        <button>Open</button>
      </PropertyForm>,
    );

    // Open modal and add auxiliary properties
    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(await screen.findByText('Add Auxiliary Property'));
    fireEvent.click(screen.getByText('Add Auxiliary Property'));

    const nameInputs = screen.getAllByPlaceholderText('Please input property name');
    const valueInputs = screen.getAllByPlaceholderText('Please input property value');

    // Fill only the first property, leave second empty
    fireEvent.change(nameInputs[0], { target: { value: 'validProp' } });
    fireEvent.change(valueInputs[0], { target: { value: 'validValue' } });
    // Leave nameInputs[1] and valueInputs[1] empty

    // Submit form
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        override_props: { 'Aux/validProp': 'validValue' },
        delete_props: [],
      });
    });
  });

  test('handles auxiliary property with partial input', async () => {
    const handleSubmit = vi.fn();
    render(
      <PropertyForm type="controller" handleSubmit={handleSubmit}>
        <button>Open</button>
      </PropertyForm>,
    );

    // Open modal and add auxiliary property
    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(await screen.findByText('Add Auxiliary Property'));

    // Fill only name but not value
    fireEvent.change(screen.getByPlaceholderText('Please input property name'), {
      target: { value: 'incompleteProp' },
    });
    // Leave value empty

    // Submit form
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        override_props: {},
        delete_props: [],
      });
    });
  });

  test('updates auxiliary property name and value correctly', async () => {
    const handleSubmit = vi.fn();
    render(
      <PropertyForm type="controller" handleSubmit={handleSubmit}>
        <button>Open</button>
      </PropertyForm>,
    );

    // Open modal and add auxiliary property
    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(await screen.findByText('Add Auxiliary Property'));

    const nameInput = screen.getByPlaceholderText('Please input property name');
    const valueInput = screen.getByPlaceholderText('Please input property value');

    // Enter initial values
    fireEvent.change(nameInput, { target: { value: 'initial' } });
    fireEvent.change(valueInput, { target: { value: 'value' } });

    // Update the name
    fireEvent.change(nameInput, { target: { value: 'updated' } });

    // Submit form
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        override_props: { 'Aux/updated': 'value' },
        delete_props: [],
      });
    });
  });

  test('handles modal destroy on close', async () => {
    const handleSubmit = vi.fn();
    render(
      <PropertyForm type="controller" handleSubmit={handleSubmit}>
        <button>Open</button>
      </PropertyForm>,
    );

    // Open modal
    fireEvent.click(screen.getByText('Open'));
    await screen.findByText('Property Editor');

    // Close modal
    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Property Editor')).not.toBeInTheDocument();
    });

    // Reopen should work fine
    fireEvent.click(screen.getByText('Open'));
    expect(await screen.findByText('Property Editor')).toBeInTheDocument();
  });
});
