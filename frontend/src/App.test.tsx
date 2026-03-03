import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NanocodeRequest, NanocodeResponse } from './types';
import App from './App';

const generateMock = vi.fn<(request: NanocodeRequest) => Promise<NanocodeResponse>>();

vi.mock('./api/nanocodeClient', async () => {
  const actual = await vi.importActual<typeof import('./api/nanocodeClient')>('./api/nanocodeClient');
  return {
    ...actual,
    generate: (...args: [NanocodeRequest]) => generateMock(...args),
    apiBaseUrl: 'http://example.test',
  };
});

vi.mock('./components/HealthIndicator', () => ({
  default: () => <div data-testid="health-indicator">Health mock</div>,
}));

vi.mock('./components/ConstraintPlayground', () => ({
  default: ({ onGenerate }: { onGenerate: (request: NanocodeRequest) => Promise<NanocodeResponse> }) => (
    <button
      onClick={() => {
        void onGenerate({ input: 'demo input', constraints: ['constraint-1'] }).catch(() => {});
      }}
    >
      Trigger playground generate
    </button>
  ),
}));

vi.mock('./components/WorkflowIdeaSpecTests', () => ({
  default: () => <div>Workflow mock</div>,
}));

vi.mock('./components/AudienceSwitcher', () => ({
  default: () => <div>Audience mock</div>,
}));

describe('App', () => {
  beforeEach(() => {
    generateMock.mockReset();
  });

  it('records last request and response after a successful generate', async () => {
    generateMock.mockResolvedValue({
      input: 'demo input',
      output: 'generated output',
    });

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger playground generate' }));

    await waitFor(() => {
      expect(generateMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Show inspector' }));

    expect(screen.getByText(/"constraints": \[/)).toBeInTheDocument();
    expect(screen.getByText(/"output": "generated output"/)).toBeInTheDocument();
  });

  it('records normalized errors when generate fails', async () => {
    generateMock.mockRejectedValue(new TypeError('Network down'));

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Trigger playground generate' }));

    await waitFor(() => {
      expect(generateMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Show inspector' }));

    await waitFor(() => {
      expect(screen.getByText(/"message": "Network down"/)).toBeInTheDocument();
    });
  });
});
