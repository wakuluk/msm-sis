import { createTheme } from '@mantine/core';
import standardButtonClasses from './styles/StandardButton.module.css';
import standardInputClasses from './styles/StandardInput.module.css';

const brand = [
  '#ebf7fe',
  '#d7edfb',
  '#b0dbf5',
  '#86c8ef',
  '#62b8e9',
  '#4aaae4',
  '#3498db',
  '#2785c1',
  '#1e72ab',
  '#145f8e',
] as const;

const fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const theme = createTheme({
  autoContrast: true,
  colors: {
    brand,
  },
  cursorType: 'pointer',
  defaultRadius: 'sm',
  fontFamily,
  fontWeights: {
    regular: '500',
    medium: '600',
    bold: '700',
  },
  headings: {
    fontFamily,
    fontWeight: '700',
  },
  fontSizes: {
    xs: '0.82rem',
    sm: '0.95rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.35rem',
  },
  lineHeights: {
    xs: '1.35',
    sm: '1.4',
    md: '1.45',
    lg: '1.5',
    xl: '1.15',
  },
  primaryColor: 'brand',
  primaryShade: {
    light: 6,
    dark: 5,
  },
  radius: {
    xs: '0.3rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
  },
  shadows: {
    sm: '0 14px 28px -18px rgb(15 23 42 / 0.24)',
    md: '0 18px 40px -24px rgb(15 23 42 / 0.32)',
  },
  spacing: {
    xs: '0.625rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  components: {
    Alert: {
      defaultProps: {
        radius: 'sm',
        variant: 'light',
      },
      styles: {
        root: {
          borderColor: 'var(--portal-ui-surface-border-color)',
        },
        title: {
          fontWeight: 700,
          letterSpacing: '-0.02em',
        },
      },
    },
    AppShell: {
      styles: {
        header: {
          backgroundColor: 'var(--portal-ui-header-background)',
          borderColor: 'var(--portal-ui-surface-border-color)',
          backdropFilter: 'blur(14px)',
        },
        main: {
          background: 'transparent',
        },
        navbar: {
          backgroundColor: 'var(--portal-ui-surface-background)',
          borderColor: 'var(--portal-ui-surface-border-color)',
        },
      },
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
      },
      styles: {
        label: {
          fontWeight: 600,
          letterSpacing: '0.02em',
        },
      },
    },
    Button: {
      defaultProps: {
        color: 'brand',
        radius: 'sm',
      },
      classNames: {
        root: standardButtonClasses.root,
      },
      styles: {
        label: {
          fontWeight: 600,
          letterSpacing: '-0.01em',
        },
        root: {
          boxShadow: '0 10px 24px -18px rgb(15 23 42 / 0.28)',
        },
      },
    },
    Fieldset: {
      defaultProps: {
        radius: 'sm',
      },
      styles: {
        legend: {
          backgroundColor: 'var(--portal-ui-surface-background)',
          color: 'var(--portal-ui-heading-color)',
          fontFamily: 'var(--portal-ui-font-family)',
          fontSize: 'var(--portal-ui-font-size)',
          fontWeight: 600,
          paddingInline: '0.5rem',
        },
        root: {
          backgroundColor: 'transparent',
          borderColor: 'var(--portal-ui-surface-border-color)',
        },
      },
    },
    Input: {
      defaultProps: {
        radius: 'xs',
        size: 'md',
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: 'xs',
        size: 'md',
      },
      classNames: {
        input: standardInputClasses.input,
        section: standardInputClasses.section,
      },
    },
    InputWrapper: {
      styles: {
        description: {
          color: 'var(--portal-ui-muted-text-color)',
        },
        error: {
          fontWeight: 600,
        },
        label: {
          color: 'var(--portal-ui-heading-color)',
          fontFamily: 'var(--portal-ui-font-family)',
          fontSize: 'var(--portal-ui-label-font-size)',
          fontWeight: 'var(--portal-ui-label-font-weight)',
          letterSpacing: 'var(--portal-ui-label-letter-spacing)',
          textTransform: 'uppercase',
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'xs',
        size: 'md',
      },
      classNames: {
        input: standardInputClasses.input,
        section: standardInputClasses.section,
      },
    },
    Paper: {
      defaultProps: {
        radius: 'sm',
        shadow: 'sm',
        withBorder: true,
      },
      styles: {
        root: {
          backgroundColor: 'var(--portal-ui-surface-background)',
          borderColor: 'var(--portal-ui-surface-border-color)',
        },
      },
    },
    Select: {
      defaultProps: {
        radius: 'xs',
        size: 'md',
      },
      classNames: {
        input: standardInputClasses.input,
        section: standardInputClasses.section,
      },
      styles: {
        dropdown: {
          backgroundColor: 'var(--portal-ui-overlay-background)',
          borderColor: 'var(--portal-ui-surface-border-color)',
        },
        option: {
          color: 'var(--portal-ui-text-color)',
        },
      },
    },
    Tabs: {
      defaultProps: {
        color: 'brand',
      },
      styles: {
        list: {
          borderColor: 'var(--portal-ui-surface-border-color)',
        },
        tab: {
          fontFamily: 'var(--portal-ui-font-family)',
          fontSize: 'var(--portal-ui-font-size)',
          fontWeight: 500,
          letterSpacing: 'var(--portal-ui-letter-spacing)',
        },
      },
    },
    Title: {
      styles: {
        root: {
          color: 'var(--portal-ui-heading-color)',
          letterSpacing: '-0.03em',
          textWrap: 'balance',
        },
      },
    },
  },
});
