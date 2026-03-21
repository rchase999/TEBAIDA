import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LoadingScreen } from './components/LoadingScreen';
import { initializeTranslations } from './i18n/locales';
import './index.css';

// Initialize i18n translations
initializeTranslations();

function Root() {
  const [loaded, setLoaded] = useState(false);

  const handleLoadComplete = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <>
      {!loaded && <LoadingScreen onComplete={handleLoadComplete} />}
      <App />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
