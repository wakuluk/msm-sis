import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { SessionLoading } from '@/components/auth/SessionLoading';
import { Router } from './Router';
import { theme } from './theme';
import { useEffect } from 'react';
import { useActions, useIsInitializing } from '@/auth/auth-store';

export default function App() {

    const actions = useActions();
    const isInitializing = useIsInitializing();

    useEffect(() => {
        void actions.init();
    }, [actions]);

  return (
      <MantineProvider theme={theme}>
          {isInitializing ? <SessionLoading /> : <Router />}
      </MantineProvider>
  );
}
