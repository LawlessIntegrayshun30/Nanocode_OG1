import { useMemo, useState } from 'react';
import './App.css';
import ConstraintPlayground from './components/ConstraintPlayground';
import WorkflowIdeaSpecTests from './components/WorkflowIdeaSpecTests';
import AudienceSwitcher from './components/AudienceSwitcher';
import HealthIndicator from './components/HealthIndicator';
import RequestInspector from './components/RequestInspector';
import type { ApiError, NanocodeRequest, NanocodeResponse } from './types';
import { generate } from './api/nanocodeClient';

type TabKey = 'playground' | 'workflow' | 'audience';

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('playground');
  const [lastRequest, setLastRequest] = useState<NanocodeRequest | null>(null);
  const [lastResponse, setLastResponse] = useState<NanocodeResponse | null>(null);
  const [lastError, setLastError] = useState<ApiError | null>(null);

  const tabs = useMemo(
    () => [
      { id: 'playground' as TabKey, label: 'Constraint Playground', description: 'See how Nanocode wires constraints into prompts.' },
      { id: 'workflow' as TabKey, label: 'Idea → Spec → Tests', description: 'Show a multi-step flow powered by one endpoint.' },
      { id: 'audience' as TabKey, label: 'Audience Switcher', description: 'Tailor the same content to each stakeholder.' },
    ],
    [],
  );

  const runGenerate = async (request: NanocodeRequest) => {
    setLastRequest(request);
    setLastError(null);
    try {
      const response = await generate(request);
      setLastResponse(response);
      return response;
    } catch (err) {
      const error = err as ApiError;
      setLastError(error);
      throw err;
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Nanocode investor demo</p>
          <h1>Showcase constraint-aware generation, guardrails, and multi-step orchestration.</h1>
          <p className="lede">
            This UI is a thin layer over the existing Nanocode wrapper. Each tab calls <code>/nanocode</code> with different constraint presets to
            illustrate how structured prompts shape the output.
          </p>
          <div className="tab-row">
            {tabs.map((tab) => (
              <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                <span>{tab.label}</span>
                <small>{tab.description}</small>
              </button>
            ))}
          </div>
        </div>
        <HealthIndicator />
      </header>

      <main>
        {activeTab === 'playground' && <ConstraintPlayground onGenerate={runGenerate} />}
        {activeTab === 'workflow' && <WorkflowIdeaSpecTests onGenerate={runGenerate} />}
        {activeTab === 'audience' && <AudienceSwitcher onGenerate={runGenerate} />}
      </main>

      <RequestInspector request={lastRequest} response={lastResponse} error={lastError} />
    </div>
  );
}

export default App;
