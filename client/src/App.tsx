import { type FocusEvent, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Projects from './pages/Projects';
import AppErrorBoundary from '@/components/AppErrorBoundary';

type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme-mode';

const isThemeMode = (value: string | null): value is ThemeMode => {
  return value === 'system' || value === 'light' || value === 'dark';
};

const safeStorageGet = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write issues (privacy mode / browser restrictions).
  }
};

const ThemeIcon = ({ mode, className }: { mode: ThemeMode; className?: string }) => {
  if (mode === 'light') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M12 3.2v2.2m0 13.2v2.2M5.8 5.8l1.6 1.6m9.2 9.2 1.6 1.6M3.2 12h2.2m13.2 0h2.2M5.8 18.2l1.6-1.6m9.2-9.2 1.6-1.6M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (mode === 'dark') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M14.8 3.5A8.9 8.9 0 1 0 20.5 17 9.2 9.2 0 0 1 14.8 3.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M4.2 8.1h15.6M4.2 12h15.6M4.2 15.9h15.6M8.4 5.1h7.2M8.4 18.9h7.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(safeStorageGet('token')));
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const storedTheme = safeStorageGet(THEME_STORAGE_KEY);
    return isThemeMode(storedTheme) ? storedTheme : 'system';
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const closeThemeMenuTimeoutRef = useRef<number | null>(null);

  const themeMediaQuery = useMemo(
    () =>
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null,
    [],
  );

  useEffect(() => {
    safeStorageSet(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    return () => {
      if (closeThemeMenuTimeoutRef.current !== null) {
        window.clearTimeout(closeThemeMenuTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const resolvedTheme =
        themeMode === 'system' ? (themeMediaQuery?.matches ? 'dark' : 'light') : themeMode;

      document.documentElement.setAttribute('data-bs-theme', resolvedTheme);
      document.documentElement.style.colorScheme = resolvedTheme;
    };

    applyTheme();

    if (themeMode !== 'system' || !themeMediaQuery) {
      return;
    }

    const onThemeChange = () => applyTheme();
    if (typeof themeMediaQuery.addEventListener === 'function') {
      themeMediaQuery.addEventListener('change', onThemeChange);
    } else {
      themeMediaQuery.addListener(onThemeChange);
    }

    return () => {
      if (typeof themeMediaQuery.removeEventListener === 'function') {
        themeMediaQuery.removeEventListener('change', onThemeChange);
      } else {
        themeMediaQuery.removeListener(onThemeChange);
      }
    };
  }, [themeMode, themeMediaQuery]);

  const logout = () => {
    try {
      window.localStorage.removeItem('token');
    } catch {
      // Ignore storage write issues.
    }
    setIsAuthenticated(false);
  };

  const clearThemeMenuCloseTimeout = () => {
    if (closeThemeMenuTimeoutRef.current !== null) {
      window.clearTimeout(closeThemeMenuTimeoutRef.current);
      closeThemeMenuTimeoutRef.current = null;
    }
  };

  const openThemeMenu = () => {
    clearThemeMenuCloseTimeout();
    setIsThemeMenuOpen(true);
  };

  const scheduleThemeMenuClose = () => {
    clearThemeMenuCloseTimeout();
    closeThemeMenuTimeoutRef.current = window.setTimeout(() => {
      setIsThemeMenuOpen(false);
    }, 170);
  };

  const handleThemeMenuBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      clearThemeMenuCloseTimeout();
      setIsThemeMenuOpen(false);
    }
  };

  const themeOptions: Array<{ value: ThemeMode; label: string }> = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  return (
    <Router>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <div
        ref={themeMenuRef}
        className={`theme-fab${isThemeMenuOpen ? ' open' : ''}`}
        onMouseEnter={openThemeMenu}
        onMouseLeave={scheduleThemeMenuClose}
        onFocus={openThemeMenu}
        onBlur={handleThemeMenuBlur}
      >
        <button
          type="button"
          className="theme-fab-trigger"
          aria-label="Theme"
          aria-haspopup="menu"
          aria-expanded={isThemeMenuOpen}
          onClick={() => setIsThemeMenuOpen((prev) => !prev)}
        >
          <ThemeIcon mode={themeMode} className={`theme-fab-icon mode-${themeMode}`} />
        </button>
        <div
          className="theme-fab-panel"
          role="menu"
          aria-label="Theme mode"
          onMouseEnter={openThemeMenu}
          onMouseLeave={scheduleThemeMenuClose}
        >
          <div className="theme-fab-title">Theme</div>
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={themeMode === option.value}
              className={`theme-fab-option${themeMode === option.value ? ' active' : ''}`}
              onClick={() => {
                setThemeMode(option.value);
                setIsThemeMenuOpen(false);
              }}
            >
              <ThemeIcon mode={option.value} className="theme-option-icon" />
              <span>{option.label}</span>
              {themeMode === option.value ? <span className="theme-option-check">✓</span> : null}
            </button>
          ))}
        </div>
      </div>
      <AppErrorBoundary>
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/projects" /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/projects" />
              ) : (
                <Login onLogin={() => setIsAuthenticated(true)} />
              )
            }
          />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/projects"
            element={isAuthenticated ? <Projects onLogout={logout} /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/projects' : '/login'} />} />
        </Routes>
      </AppErrorBoundary>
    </Router>
  );
};

export default App;
