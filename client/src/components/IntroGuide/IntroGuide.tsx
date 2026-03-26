import { useState } from 'react';
import api from '@/services/api';

interface Props {
  onDismiss: () => void;
}

interface Step {
  title: string;
  description: string;
  image: string;
}

const steps: Step[] = [
  {
    title: 'Your Projects Dashboard',
    description:
      'After logging in you land on the Projects page. Here you can see all your tracked repositories with key metrics: stars, forks, open issues, and creation date. Use the "Add Project" button to connect new repos, "Settings" to configure your AI key, and "Log Out" to sign out.',
    image: '/intro/step1-projects.png',
  },
  {
    title: 'Adding a Repository',
    description:
      'Click "Add Project" and enter a repository path. Supported formats: "owner/repo" for GitHub, "gitlab:group/repo" for GitLab, "bitbucket:workspace/repo" for Bitbucket, or a full HTTPS URL. The system will automatically fetch the repo info.',
    image: '/intro/step2-add-project.png',
  },
  {
    title: 'Repository Insights',
    description:
      'Click "Open insights" on any project card to explore branches, issues, and pull requests. Switch between tabs to browse data. Use the "Ask latest changes" button to get an AI-powered summary of recent activity on any branch.',
    image: '/intro/step3-insights.png',
  },
  {
    title: 'Configure Your AI Key',
    description:
      'To use AI analysis features, open Settings (gear icon) and enter your OpenAI API key. Your key is stored securely and used only for generating analysis summaries. You can update or remove it at any time.',
    image: '/intro/step4-settings.png',
  },
];

const IntroGuide = ({ onDismiss }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  const handleDismiss = async () => {
    if (dontShowAgain) {
      try {
        await api.put('/user/settings', { hideIntro: true });
      } catch {
        // Silently fail — user can toggle in settings later.
      }
    }
    onDismiss();
  };

  const handleSkip = () => {
    void handleDismiss();
  };

  const handleNext = () => {
    if (isLastStep) {
      void handleDismiss();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1100 }}
    >
      <div
        className="auth-card rounded shadow-lg d-flex flex-column"
        style={{ maxWidth: 720, width: '95%', maxHeight: '90vh', overflow: 'auto' }}
      >
        {/* Header */}
        <div className="p-3 pb-0 d-flex justify-content-between align-items-center">
          <span className="text-muted small">
            Step {currentStep + 1} of {steps.length}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-link text-muted text-decoration-none"
            onClick={handleSkip}
          >
            Skip
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-3 pt-2">
          <div className="progress" style={{ height: 4 }}>
            <div
              className="progress-bar"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h5 className="mb-3">{step.title}</h5>
          <div className="mb-3 text-center">
            <img
              src={step.image}
              alt={step.title}
              className="rounded border"
              style={{ maxWidth: '100%', maxHeight: 350, objectFit: 'contain' }}
            />
          </div>
          <p className="text-muted mb-0">{step.description}</p>
        </div>

        {/* Footer */}
        <div className="p-3 pt-0">
          {isLastStep && (
            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="intro-dont-show"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="intro-dont-show">
                Don't show this guide again
              </label>
            </div>
          )}

          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              Previous
            </button>
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              {isLastStep ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroGuide;
