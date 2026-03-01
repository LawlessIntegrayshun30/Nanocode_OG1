import { useMemo, useState } from 'react';
import type { NanocodeRequest, NanocodeResponse } from '../types';

type Props = {
  onGenerate: (request: NanocodeRequest) => Promise<NanocodeResponse>;
};

type ConstraintResult = {
  constraint: string;
  status: 'pending' | 'met' | 'missed' | 'uncertain';
  detail: string;
};

const defaultConstraints = [
  'Use bullet points only',
  'Max 120 words',
  'Tone: formal and confident',
];

const defaultInput =
  'Explain how Nanocode combines structured constraints with model prompts to keep enterprise content on-brand.';

function normalizeConstraints(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildPromptPreview(input: string, constraints: string[]) {
  const constraintLines = constraints.map((c) => `- ${c}`).join('\n');
  return `You are Nanocode, a structured prompt orchestrator.\n\nUser request:\n${input}\n\nConstraints to weave into the prompt:\n${constraintLines}\n\nReturn a concise, production-ready response that clearly follows the constraints.`;
}

function countBullets(text: string) {
  return text
    .split('\n')
    .filter((line) => line.trim().match(/^[-*•]|\d+\./)).length;
}

function evaluateConstraint(constraint: string, output: string): ConstraintResult {
  if (!output) {
    return { constraint, status: 'pending', detail: 'Run to evaluate' };
  }

  const lower = constraint.toLowerCase();
  const words = output.split(/\s+/).filter(Boolean).length;
  const bullets = countBullets(output);

  if (lower.includes('bullet')) {
    const met = bullets >= 2;
    return {
      constraint,
      status: met ? 'met' : 'missed',
      detail: `${bullets} bullet lines`,
    };
  }

  const maxMatch = lower.match(/max[^0-9]*(\d+)/);
  if (maxMatch) {
    const limit = Number(maxMatch[1]);
    const met = words <= limit;
    return {
      constraint,
      status: met ? 'met' : 'missed',
      detail: `${words}/${limit} words`,
    };
  }

  if (lower.includes('formal')) {
    const hasExclaim = output.includes('!');
    const met = !hasExclaim && words > 0;
    return {
      constraint,
      status: met ? 'met' : 'uncertain',
      detail: met ? 'No casual markers detected' : 'Tone unclear',
    };
  }

  if (lower.includes('tone')) {
    const met = output.length > 0;
    return { constraint, status: met ? 'uncertain' : 'missed', detail: 'Tone check is subjective' };
  }

  const found = output.toLowerCase().includes(lower.split(':')[0]);
  return {
    constraint,
    status: found ? 'met' : 'uncertain',
    detail: found ? 'Referenced in output' : 'Not obvious in output',
  };
}

function extractPrompt(metadata?: Record<string, unknown>): string | undefined {
  const prompt = metadata ? (metadata as Record<string, unknown>).prompt : undefined;
  if (typeof prompt === 'string') return prompt;
  if (prompt && typeof prompt === 'object') return JSON.stringify(prompt, null, 2);
  return undefined;
}

export default function ConstraintPlayground({ onGenerate }: Props) {
  const [userInput, setUserInput] = useState(defaultInput);
  const [constraintsRaw, setConstraintsRaw] = useState(defaultConstraints.join('\n'));
  const [showPrompt, setShowPrompt] = useState(false);
  const [response, setResponse] = useState<NanocodeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const constraints = useMemo(() => normalizeConstraints(constraintsRaw), [constraintsRaw]);
  const evaluation = useMemo(
    () => constraints.map((constraint) => evaluateConstraint(constraint, response?.output ?? '')),
    [constraints, response],
  );

  const satisfiedCount = evaluation.filter((item) => item.status === 'met').length;
  const promptPreview = useMemo(() => {
    const prompt = extractPrompt(response?.metadata);
    return prompt ?? buildPromptPreview(userInput, constraints);
  }, [response, userInput, constraints]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    const request: NanocodeRequest = {
      input: userInput,
      constraints: ['Mode: constraint_playground', ...constraints],
    };

    try {
      const result = await onGenerate(request);
      setResponse(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-grid">
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Constraint Playground</p>
            <h3>Craft the ask and rules</h3>
          </div>
          <button className="ghost-button" onClick={() => setConstraintsRaw(defaultConstraints.join('\n'))}>
            Reset constraints
          </button>
        </div>
        <label className="field">
          <span>User request</span>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={6}
            placeholder="Describe what you want Nanocode to generate..."
          />
        </label>
        <label className="field">
          <span>Constraints (one per line)</span>
          <textarea
            value={constraintsRaw}
            onChange={(e) => setConstraintsRaw(e.target.value)}
            rows={6}
            placeholder="Examples: Use bullet points only\nMax 120 words\nTone: formal"
          />
          <p className="helper">Examples: “Use bullet points only”, “Max 120 words”, “Tone: formal”.</p>
        </label>
        <div className="actions">
          <button className="primary" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating…' : 'Generate via Nanocode'}
          </button>
          <button className="secondary" onClick={() => setShowPrompt((prev) => !prev)}>
            {showPrompt ? 'Hide internal prompt' : 'Show internal prompt'}
          </button>
        </div>
        {error && (
          <div className="error-box">
            <p>The demo backend is temporarily unavailable. Please try again.</p>
            <p className="helper">{error}</p>
          </div>
        )}
        {showPrompt && (
          <div className="prompt-preview">
            <p className="eyebrow">Nanocode internal prompt (preview)</p>
            <pre>{promptPreview}</pre>
          </div>
        )}
      </div>

      <div className="panel-card">
        <div className="panel-header space-between">
          <div>
            <p className="eyebrow">Live output</p>
            <h3>Nanocode response</h3>
          </div>
          <div className="constraint-score">
            Constraints satisfied: {satisfiedCount}/{constraints.length || 0}
          </div>
        </div>

        <div className="output-shell">
          {loading ? <div className="spinner">Thinking…</div> : <pre>{response?.output ?? 'Run the request to see Nanocode in action.'}</pre>}
        </div>

        <div className="constraint-checker">
          {constraints.map((constraint, idx) => {
            const result = evaluation[idx];
            const status = result?.status ?? 'pending';
            return (
              <div key={constraint} className={`constraint-chip ${status}`}>
                <div className="status-dot" />
                <div className="constraint-text">
                  <strong>{constraint}</strong>
                  <span>{result?.detail}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
