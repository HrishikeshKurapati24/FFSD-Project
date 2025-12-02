  import { StrictMode, useEffect } from 'react'
  import { createRoot } from 'react-dom/client'
  import './index.css'
  import App from './App.jsx'
  import { Provider, useSelector } from 'react-redux'
  import { store } from './store'

  const RootThemeApplier = () => {
    const mode = useSelector((state) => state.theme.mode);

    useEffect(() => {
      const root = document.documentElement;
      if (mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      root.setAttribute('data-theme', mode);
      // Also apply to body for better compatibility
      if (mode === 'dark') {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }, [mode]);

    // Apply initial theme on mount
    useEffect(() => {
      const root = document.documentElement;
      const initialMode = store.getState().theme.mode;
      if (initialMode === 'dark') {
        root.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      root.setAttribute('data-theme', initialMode);
    }, []);

    return <App />;
  };

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <Provider store={store}>
        <RootThemeApplier />
      </Provider>
    </StrictMode>,
  )
