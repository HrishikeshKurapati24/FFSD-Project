import { useEffect } from 'react';

const loadedStyles = new Set();
const loadedScripts = new Set();

const appendStylesheet = (href) => {
    if (typeof document === 'undefined' || !href || loadedStyles.has(href)) {
        return;
    }

    const existing = document.querySelector(`link[data-external-style="${href}"]`);
    if (existing) {
        loadedStyles.add(href);
        return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.externalStyle = href;
    document.head.appendChild(link);
    loadedStyles.add(href);
};

const appendScript = (src) => {
    if (typeof document === 'undefined' || !src || loadedScripts.has(src)) {
        return;
    }

    const existing = document.querySelector(`script[data-external-script="${src}"]`);
    if (existing) {
        loadedScripts.add(src);
        return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.defer = true;
    script.dataset.externalScript = src;
    document.body.appendChild(script);
    loadedScripts.add(src);
};

export const useExternalAssets = ({ styles = [], scripts = [] } = {}) => {
    useEffect(() => {
        styles.forEach(appendStylesheet);
        scripts.forEach(appendScript);
    }, [styles, scripts]);
};


