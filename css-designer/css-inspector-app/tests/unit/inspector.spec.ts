import { render, screen, fireEvent } from '@testing-library/react';
import InspectorPanel from '../../src/renderer/components/InspectorPanel/InspectorPanel';

describe('InspectorPanel', () => {
  test('renders Visual Inspector', () => {
    render(<InspectorPanel />);
    const visualInspectorElement = screen.getByTestId('visual-inspector');
    expect(visualInspectorElement).toBeInTheDocument();
  });

  test('allows real-time CSS editing', () => {
    render(<InspectorPanel />);
    const cssEditorInput = screen.getByPlaceholderText('Edit CSS...');
    fireEvent.change(cssEditorInput, { target: { value: 'color: red;' } });
    expect(cssEditorInput.value).toBe('color: red;');
  });

  test('copies complete CSS on button click', () => {
    render(<InspectorPanel />);
    const copyButton = screen.getByText('Copy CSS');
    fireEvent.click(copyButton);
    // Assuming there's a function to check clipboard content
    expect(navigator.clipboard.readText()).resolves.toBe('Expected CSS content');
  });

  test('simulates pseudo-classes', () => {
    render(<InspectorPanel />);
    const pseudoStateButton = screen.getByText('Hover');
    fireEvent.click(pseudoStateButton);
    const simulatedElement = screen.getByTestId('simulated-element');
    expect(simulatedElement).toHaveStyle('background-color: blue;'); // Example style for hover
  });

  // Additional tests for other functionalities can be added here
});