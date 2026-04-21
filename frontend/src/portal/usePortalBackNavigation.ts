import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type UsePortalBackNavigationOptions = {
  fallbackPath: string;
  replace?: boolean;
};

export function usePortalBackNavigation({
  fallbackPath,
  replace = true,
}: UsePortalBackNavigationOptions) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = useCallback(() => {
    const historyIndex =
      typeof window !== 'undefined' && typeof window.history.state?.idx === 'number'
        ? window.history.state.idx
        : null;

    if ((historyIndex !== null && historyIndex > 0) || location.key !== 'default') {
      navigate(-1);
      return;
    }

    navigate(fallbackPath, { replace });
  }, [fallbackPath, location.key, navigate, replace]);

  return { handleBack };
}
