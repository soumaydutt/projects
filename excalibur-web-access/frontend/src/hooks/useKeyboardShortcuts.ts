import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutHandler[],
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape key to work in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const metaMatch = shortcut.meta ? event.metaKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Global navigation shortcuts hook
export function useGlobalShortcuts(onCommandPalette: () => void) {
  const navigate = useNavigate();

  const shortcuts: ShortcutHandler[] = [
    {
      key: 'k',
      ctrl: true,
      handler: onCommandPalette,
      description: 'Open command palette',
    },
    {
      key: '/',
      handler: onCommandPalette,
      description: 'Open command palette',
    },
    {
      key: 'Escape',
      handler: () => {
        // Close any open modals/dialogs
        const event = new CustomEvent('closeModals');
        document.dispatchEvent(event);
      },
      description: 'Close dialogs',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  // Sequence shortcuts (g then d for "go to dashboard")
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleSequence = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      const key = event.key.toLowerCase();

      // Reset if more than 1 second has passed
      if (now - lastKeyTime > 1000) {
        lastKey = '';
      }

      if (lastKey === 'g') {
        switch (key) {
          case 'd':
            event.preventDefault();
            navigate('/');
            break;
          case 'a':
            event.preventDefault();
            navigate('/accounts');
            break;
          case 'i':
            event.preventDefault();
            navigate('/invoices');
            break;
          case 'p':
            event.preventDefault();
            navigate('/payments');
            break;
          case 'c':
            event.preventDefault();
            navigate('/collections');
            break;
          case 'r':
            event.preventDefault();
            navigate('/price-plans');
            break;
          case 'l':
            event.preventDefault();
            navigate('/audit-logs');
            break;
        }
        lastKey = '';
      } else if (lastKey === 'n') {
        switch (key) {
          case 'a':
            event.preventDefault();
            navigate('/accounts/new');
            break;
          case 'p':
            event.preventDefault();
            navigate('/payments/new');
            break;
        }
        lastKey = '';
      } else {
        lastKey = key;
      }

      lastKeyTime = now;
    };

    document.addEventListener('keydown', handleSequence);
    return () => document.removeEventListener('keydown', handleSequence);
  }, [navigate]);
}
