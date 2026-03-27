import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { router } from './app/router';
import { useEffect } from 'react';
import { PwaInstallPrompt } from './components/pwa/PwaInstallPrompt';
import { PwaUpdatePrompt } from './components/pwa/PwaUpdatePrompt';

function ThemeInit() {
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
    const colorScheme = localStorage.getItem('colorScheme');
    if (colorScheme === 'wellness') {
      document.documentElement.classList.add('theme-wellness');
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <AppProviders>
      <ThemeInit />
      <RouterProvider router={router} />
      <PwaInstallPrompt />
      <PwaUpdatePrompt />
    </AppProviders>
  );
}
