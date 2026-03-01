import { useMemo, useState } from 'react';
import type { NanocodeRequest, NanocodeResponse } from '../types';

type Props = {
  onGenerate: (request: NanocodeRequest) => Promise<NanocodeResponse>;
};

type Audience = {
  id: string;
  label: string;
  constraints: string[];
};

type AudienceResult = {
  output: string;
  promptPreview: string;
};

const audiences: Audience[] = [
  {
    id: 'executive',
    label: 'Executive summary',
    constraints: ['Focus on business impact, timelines, and metrics.', 'Bullet summary; keep it concise.'],
  },
  {
    id: 'pm',
    label: 'Product manager',
    constraints: ['Highlight user problems, rollout plan, and telemetry.', 'Call out dependencies and owners.'],
  },
  {
    id: 'developer',
    label: 'Developer',
    constraints: ['Include technical details, pseudo-code, or API references.', 'Mention edge cases and failure modes.'],
  },
  {
    id: 'legal',
    label: 'Legal / compliance',
    constraints: ['Use cautious language and note compliance considerations.', 'Explicitly call out risks and mitigations.'],
  },
];

function extractPrompt(metadata?: Record<string, unknown>): string | undefined {
  const prompt = metadata ? (metadata as Record<string, unknown>).prompt : undefined;
  if (typeof prompt === 'string') return prompt;
  if (prompt && typeof prompt === 'object') return JSON.stringify(prompt, null, 2);
  return undefined;
}

export default function AudienceSwitcher({ onGenerate }: Props) {
  const [message, setMessage] = useState(
    'We are rolling out Nanocode guardrails so every team can launch AI-backed features without risk. The change updates prompt templates, adds validation, and records telemetry.',
  );
  const [tone, setTone] = useState('Formal');
  const [length, setLength] = useState(140);
  const [results, setResults] = useState<Record<string, AudienceResult>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openPrompts, setOpenPrompts] = useState<Record<string, boolean>>({});

  const buildPromptPreview = (input: string, constraints: string[]) => {
    const list = constraints.map((c) => `- ${c}`).join('\n');
    return `Audience-targeted prompt\n\nInput:\n${input}\n\nConstraints:\n${list}\n\nReturn content tailored to the specified audience while respecting tone and length.`;
  };

  const constraintSet = useMemo(
    () =>
      audiences.map((audience) => ({
        ...audience,
        appliedConstraints: [
          `Mode: audience_switcher:${audience.id}`,
          `Audience: ${audience.label}`,
          `Tone: ${tone}`,
          `Max ${length} words`,
          ...audience.constraints,
        ],
      })),
    [tone, length],
  );

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const nextResults: Record<string, AudienceResult> = {};

      await Promise.all(
        constraintSet.map(async (audience) => {
          const request: NanocodeRequest = {
            input: message,
            constraints: audience.appliedConstraints,
          };
          const res = await onGenerate(request);
          const promptFromMetadata = extractPrompt(res.metadata);
          nextResults[audience.id] = {
            output: res.output,
            promptPreview: promptFromMetadata ?? buildPromptPreview(message, audience.appliedConstraints),
          };
        }),
      );

      setResults(nextResults);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const togglePrompt = (id: string) => {
    setOpenPrompts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Audience Switcher</p>
          <h3>Reframe the same message for each stakeholder</h3>
        </div>
        <button className="primary" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate for all audiences'}
        </button>
      </div>

      <label className="field">
        <span>Core message / technical change</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
      </label>

      <div className="control-row">
        <label className="field inline">
          <span>Tone</span>
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option>Formal</option>
            <option>Neutral</option>
            <option>Friendly</option>
          </select>
        </label>

        <label className="field inline">
          <span>Maximum length</span>
          <div className="slider-row">
            <input
              type="range"
              min={60}
              max={240}
              step={20}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
            />
            <span className="helper">{length} words</span>
          </div>
        </label>
      </div>

      {error && (
        <div className="error-box">
          <p>The demo backend is temporarily unavailable. Please try again.</p>
          <p className="helper">{error}</p>
        </div>
      )}

      <div className="audience-grid">
        {constraintSet.map((audience) => {
          const result = results[audience.id];
          return (
            <div key={audience.id} className="audience-card">
              <div className="audience-title">
                <h4>{audience.label}</h4>
                <p className="helper">Constraints: {audience.appliedConstraints.length}</p>
              </div>
              <div className="badge-row">
                {audience.appliedConstraints.slice(0, 4).map((c) => (
                  <span key={c} className="pill">
                    {c}
                  </span>
                ))}
              </div>
              <div className="output-shell small">
                {loading && !result ? <div className="spinner">Thinking…</div> : <pre>{result?.output ?? 'Generate to see this audience view.'}</pre>}
              </div>
              <button className="ghost-button" onClick={() => togglePrompt(audience.id)}>
                {openPrompts[audience.id] ? 'Hide effective prompt' : 'Show effective prompt'}
              </button>
              {openPrompts[audience.id] && (
                <div className="prompt-preview">
                  <pre>{result?.promptPreview ?? buildPromptPreview(message, audience.appliedConstraints)}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
