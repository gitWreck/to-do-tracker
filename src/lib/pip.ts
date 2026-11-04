// Document Picture-in-Picture manager for true desktop always-on-top mini-widget

export interface PipWindowRef {
  window: Window | null;
  container: HTMLElement | null;
  isOpen: boolean;
}

const pipState: PipWindowRef = {
  window: null,
  container: null,
  isOpen: false,
};

export function isDocumentPipSupported(): boolean {
  return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
}

export async function openMiniWidgetPip(
  renderContent: (container: HTMLElement) => void,
  onClose?: () => void
): Promise<Window | null> {
  if (!isDocumentPipSupported()) {
    console.warn('Document Picture-in-Picture is not supported in this browser environment.');
    return null;
  }

  try {
    // If already open, focus it
    if (pipState.window && !pipState.window.closed) {
      pipState.window.focus();
      return pipState.window;
    }

    // @ts-expect-error - documentPictureInPicture is standard in modern Chromium/Edge
    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width: 360,
      height: 90,
    });

    pipState.window = pipWindow;
    pipState.isOpen = true;

    // Copy styles from current document to pipWindow
    Array.from(document.styleSheets).forEach(styleSheet => {
      try {
        if (styleSheet.href) {
          const newLink = pipWindow.document.createElement('link');
          newLink.rel = 'stylesheet';
          newLink.href = styleSheet.href;
          pipWindow.document.head.appendChild(newLink);
        } else if (styleSheet.cssRules) {
          const newStyle = pipWindow.document.createElement('style');
          Array.from(styleSheet.cssRules).forEach(rule => {
            newStyle.appendChild(pipWindow.document.createTextNode(rule.cssText));
          });
          pipWindow.document.head.appendChild(newStyle);
        }
      } catch {
        // Handle cross-origin stylesheet exceptions gracefully
      }
    });

    // Dark background for floating window
    pipWindow.document.body.style.margin = '0';
    pipWindow.document.body.style.backgroundColor = '#0a0a0a';
    pipWindow.document.body.style.color = '#ededed';
    pipWindow.document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    pipWindow.document.body.style.overflow = 'hidden';

    const container = pipWindow.document.createElement('div');
    container.id = 'mini-widget-root';
    pipWindow.document.body.appendChild(container);
    pipState.container = container;

    // Render initial content
    renderContent(container);

    pipWindow.addEventListener('pagehide', () => {
      pipState.window = null;
      pipState.container = null;
      pipState.isOpen = false;
      if (onClose) onClose();
    });

    return pipWindow;
  } catch (err) {
    console.warn('Failed to open Picture-in-Picture window:', err);
    return null;
  }
}

export function closeMiniWidgetPip(): void {
  if (pipState.window && !pipState.window.closed) {
    pipState.window.close();
  }
  pipState.window = null;
  pipState.container = null;
  pipState.isOpen = false;
}

export function updateMiniWidgetPip(renderContent: (container: HTMLElement) => void): void {
  if (pipState.window && !pipState.window.closed && pipState.container) {
    renderContent(pipState.container);
  }
}

export function getPipState(): PipWindowRef {
  return pipState;
}
