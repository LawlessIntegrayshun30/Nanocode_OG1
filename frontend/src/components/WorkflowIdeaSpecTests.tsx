import { useMemo, useState } from 'react';
import type { NanocodeRequest, NanocodeResponse } from '../types';

type Props = {
  onGenerate: (request: NanocodeRequest) => Promise<NanocodeResponse>;
};

type StepKey = 'spec' | 'tests' | 'risks' | null;

const defaultIdea =
  'Launch an investor-ready Nanocode console that lets teams design constraint-aware prompts, preview guardrails, and export workflows to their stack.';

export default function WorkflowIdeaSpecTests({ onGenerate }: Props) {
  const [idea, setIdea] = useState(defaultIdea);
  const [spec, setSpec] = useState('');
  const [tests, setTests] = useState('');
  const [risks, setRisks] = useState('');
  const [loading, setLoading] = useState<StepKey>(null);
  const [error, setError] = useState<string | null>(null);

  const connectors = useMemo(
    () => [
      { id: '1', label: 'Idea → Spec', helper: 'Nanocode structures raw intent into an actionable spec.' },
      { id: '2', label: 'Spec → Tests', helper: 'Reuse the spec as input to generate executable tests.' },
      { id: '3', label: 'Spec + Tests → Risks', helper: 'Cross-check both artifacts to surface risk.' },
    ],
    [],
  );

  const runStep = async (step: StepKey) => {
    if (!step) return;
    setLoading(step);
    setError(null);

    try {
      if (step === 'spec') {
        const request: NanocodeRequest = {
          input: idea,
          constraints: [
            'Mode: idea_to_spec',
            'Must produce sections: Context, Requirements, Edge Cases.',
            'Use numbered bullet points for Requirements.',
            'Flag any missing information succinctly.',
          ],
        };
        const res = await onGenerate(request);
        setSpec(res.output);
      }

      if (step === 'tests') {
        const request: NanocodeRequest = {
          input: spec || idea,
          constraints: [
            'Mode: specification_to_tests',
            'Each test must include: Title, Precondition, Steps, Expected Result.',
            'Output in markdown.',
            'Prioritize critical flows first.',
          ],
        };
        const res = await onGenerate(request);
        setTests(res.output);
      }

      if (step === 'risks') {
        const combinedInput = `Specification:\n${spec || 'Not provided'}\n\nTest cases:\n${tests || 'Not provided'}`;
        const request: NanocodeRequest = {
          input: combinedInput,
          constraints: [
            'Mode: risk_summary',
            'Identify top 5 risks.',
            'For each risk, include Likelihood (Low/Med/High), Impact (Low/Med/High), and Mitigation.',
            'Output as concise bullet cards.',
          ],
        };
        const res = await onGenerate(request);
        setRisks(res.output);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(null);
    }
  };

  const riskCards = useMemo(() => {
    if (!risks) return [];
    return risks
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block, index) => ({ id: index, text: block }));
  }, [risks]);

  return (
    <div className="workflow-grid">
      <div className="connector-rail">
        {connectors.map((item) => (
          <div key={item.id} className="connector">
            <div className="connector-number">{item.id}</div>
            <div>
              <p className="eyebrow">{item.label}</p>
              <p className="helper">{item.helper}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="workflow-steps">
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Step 1</p>
              <h3>Idea → Specification</h3>
            </div>
            <button className="primary" onClick={() => runStep('spec')} disabled={loading === 'spec'}>
              {loading === 'spec' ? 'Generating…' : 'Generate specification'}
            </button>
          </div>
          <label className="field">
            <span>Describe your idea</span>
            <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={4} />
          </label>
          <label className="field">
            <span>Specification preview</span>
            <textarea
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              placeholder="Nanocode will produce a structured spec here."
              rows={6}
            />
          </label>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Step 2</p>
              <h3>Specification → Tests</h3>
            </div>
            <button className="primary" onClick={() => runStep('tests')} disabled={loading === 'tests'}>
              {loading === 'tests' ? 'Generating…' : 'Generate test cases'}
            </button>
          </div>
          <label className="field">
            <span>Test case source</span>
            <textarea
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              placeholder="Paste or refine the specification that will feed tests."
              rows={6}
            />
          </label>
          <label className="field">
            <span>Generated tests</span>
            <textarea
              value={tests}
              onChange={(e) => setTests(e.target.value)}
              placeholder="Nanocode will return markdown test cases here."
              rows={6}
            />
          </label>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Step 3</p>
              <h3>Spec + Tests → Risk summary</h3>
            </div>
            <button className="primary" onClick={() => runStep('risks')} disabled={loading === 'risks'}>
              {loading === 'risks' ? 'Analyzing…' : 'Analyze risks'}
            </button>
          </div>
          <div className="risk-wrapper">
            {riskCards.length > 0 &&
              riskCards.map((card) => (
                <div key={card.id} className="risk-card">
                  <p>{card.text}</p>
                </div>
              ))}
            {riskCards.length === 0 && risks && <pre className="output-shell small">{risks}</pre>}
            {riskCards.length === 0 && !risks && (
              <div className="placeholder">Nanocode will turn the spec + tests into a risk list you can review.</div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-box">
          <p>The demo backend is temporarily unavailable. Please try again.</p>
          <p className="helper">{error}</p>
        </div>
      )}
    </div>
  );
}
