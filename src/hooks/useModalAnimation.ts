import { useState, useEffect } from 'react';

interface UseModalAnimationOptions {
  durationMs?: number;
  onClose?: () => void;
  closeOnEscape?: boolean;
}

/**
 * Hook to manage smooth enter (pop-in) and exit (pop-out) animations for modals & dialogs.
 * Keeps the modal mounted in the DOM during the exit animation window.
 */
export function useModalAnimation(
  isOpen: boolean,
  options: UseModalAnimationOptions = {}
) {
  const { durationMs = 200, onClose, closeOnEscape = true } = options;
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isEntered, setIsEntered] = useState(false);

  useEffect(() => {
    let timeoutId: number;

    if (isOpen) {
      setShouldRender(true);
      // Double RAF for reliable transition triggering across all browser engines
      const frameId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsEntered(true);
        });
      });
      return () => cancelAnimationFrame(frameId);
    } else {
      setIsEntered(false);
      timeoutId = window.setTimeout(() => {
        setShouldRender(false);
      }, durationMs);
    }

    return () => clearTimeout(timeoutId);
  }, [isOpen, durationMs]);

  // Handle Escape key to gracefully trigger onClose
  useEffect(() => {
    if (!isOpen || !closeOnEscape || !onClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  return { shouldRender, isEntered };
}

