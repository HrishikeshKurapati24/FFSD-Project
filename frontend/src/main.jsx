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
    }, [mode]);

    return <App />;
  };

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <Provider store={store}>
        <RootThemeApplier />
      </Provider>
    </StrictMode>,
  )
