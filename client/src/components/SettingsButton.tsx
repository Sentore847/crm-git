import { useState } from 'react';
import axios from 'axios';
import api from '../services/api';

interface SettingsResponse {
  aiProvider: string;
  aiApiKey: string | null;
  aiModel: string | null;
  aiBaseUrl: string | null;
  hideIntro: boolean;
}

const AI_PROVIDERS: Record<string, { label: string; defaultModel: string }> = {
  openai:     { label: 'OpenAI',                    defaultModel: 'gpt-4o-mini' },
  gemini:     { label: 'Google Gemini',              defaultModel: 'gemini-2.0-flash' },
  deepseek:   { label: 'DeepSeek',                   defaultModel: 'deepseek-chat' },
  openrouter: { label: 'OpenRouter',                 defaultModel: 'openai/gpt-4o-mini' },
  custom:     { label: 'Custom (OpenAI-compatible)',  defaultModel: '' },
};

const SettingsButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [hideIntro, setHideIntro] = useState(false);

  const openModal = async () => {
    setShowModal(true);
    setError('');
    setSuccess('');
    setApiKey('');
    setLoading(true);

    try {
      const res = await api.get<SettingsResponse>('/user/settings');
      setProvider(res.data.aiProvider || 'openai');
      setCurrentKey(res.data.aiApiKey);
      setModel(res.data.aiModel || '');
      setBaseUrl(res.data.aiBaseUrl || '');
      setHideIntro(res.data.hideIntro);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to load settings');
      } else {
        setError('Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload: Record<string, unknown> = {
        aiProvider: provider,
        aiModel: model.trim() || null,
        aiBaseUrl: provider === 'custom' ? baseUrl.trim() || null : null,
      };

      if (apiKey.trim()) {
        payload.aiApiKey = apiKey.trim();
      }

      const res = await api.put<SettingsResponse>('/user/settings', payload);
      setCurrentKey(res.data.aiApiKey);
      setApiKey('');
      setSuccess('Settings saved');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to save settings');
      } else {
        setError('Failed to save settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.put<SettingsResponse>('/user/settings', { aiApiKey: null });
      setCurrentKey(null);
      setApiKey('');
      setSuccess('API key removed');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to clear key');
      } else {
        setError('Failed to clear key');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleIntroToggle = async (show: boolean) => {
    const newHideIntro = !show;
    setHideIntro(newHideIntro);

    try {
      await api.put<SettingsResponse>('/user/settings', { hideIntro: newHideIntro });
    } catch {
      setHideIntro(!newHideIntro);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
    setSuccess('');
  };

  const currentProviderConfig = AI_PROVIDERS[provider] || AI_PROVIDERS.openai;

  return (
    <>
      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={() => void openModal()}
        title="Settings"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          style={{ width: 18, height: 18 }}
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {showModal && (
        <div
          className="d-flex align-items-center justify-content-center position-fixed top-0 start-0 w-100 h-100"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="auth-card p-4 rounded shadow" style={{ maxWidth: 480, width: '100%' }}>
            <h5 className="mb-3">Settings</h5>

            {loading && <p className="text-muted">Loading...</p>}

            {!loading && (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">AI Provider</label>
                  <select
                    className="form-select"
                    value={provider}
                    onChange={e => setProvider(e.target.value)}
                    disabled={saving}
                  >
                    {Object.entries(AI_PROVIDERS).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">API Key</label>
                  <p className="text-muted small mb-2">
                    {currentKey
                      ? `Current key: ${currentKey}`
                      : 'No key configured. AI features are disabled.'}
                  </p>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your API key..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Model</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={currentProviderConfig.defaultModel || 'Enter model name...'}
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    disabled={saving}
                  />
                  <div className="form-text">
                    {currentProviderConfig.defaultModel
                      ? `Leave empty to use default: ${currentProviderConfig.defaultModel}`
                      : 'Specify the model name'}
                  </div>
                </div>

                {provider === 'custom' && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Base URL</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://api.example.com/v1"
                      value={baseUrl}
                      onChange={e => setBaseUrl(e.target.value)}
                      disabled={saving}
                    />
                    <div className="form-text">
                      OpenAI-compatible API endpoint (without /chat/completions)
                    </div>
                  </div>
                )}

                <hr />

                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="settings-show-intro"
                    checked={!hideIntro}
                    onChange={e => void handleIntroToggle(e.target.checked)}
                    disabled={saving}
                  />
                  <label className="form-check-label" htmlFor="settings-show-intro">
                    Show intro guide on login
                  </label>
                </div>

                {error && <div className="alert alert-danger py-2">{error}</div>}
                {success && <div className="alert alert-success py-2">{success}</div>}

                <div className="d-flex justify-content-between">
                  <div>
                    {currentKey && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => void handleClear()}
                        disabled={saving}
                      >
                        Remove key
                      </button>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeModal}
                      disabled={saving}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void handleSave()}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsButton;
