import type { BackgroundToContentMessage } from '../core/types.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main(ctx) {
    // Lazy-loaded recorder module reference
    let recorder: typeof import('../content/recorder.js') | null = null;

    // Listen for messages from background service worker
    browser.runtime.onMessage.addListener(handleMessage);
    ctx.onInvalidated(() => {
      browser.runtime.onMessage.removeListener(handleMessage);
    });

    // Notify background that the content script is ready
    browser.runtime.sendMessage({ type: 'CONTENT_READY', tabId: -1 }).catch(() => {
      // Background may not be listening yet — that's fine
    });

    function handleMessage(
      message: BackgroundToContentMessage,
      _sender: Browser.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ): true | undefined {
      handleMessageAsync(message).then(() => sendResponse());
      return true; // Indicates async response
    }

    async function handleMessageAsync(message: BackgroundToContentMessage): Promise<void> {
      console.log('[SOP Recorder] content received message:', message.type);
      try {
        switch (message.type) {
          case 'START_CAPTURE': {
            console.log('[SOP Recorder] Loading recorder module...');
            if (!recorder) {
              recorder = await import('../content/recorder.js');
            }
            recorder.startCapture();
            console.log('[SOP Recorder] Capture started');
            break;
          }
          case 'STOP_CAPTURE':
            recorder?.stopCapture();
            break;
          case 'PAUSE_CAPTURE':
            recorder?.pauseCapture();
            break;
          case 'RESUME_CAPTURE':
            recorder?.resumeCapture();
            break;
          case 'SHOW_OVERLAY':
            recorder?.showOverlay();
            break;
          case 'REMOVE_OVERLAY':
            recorder?.removeOverlay();
            break;
        }
      } catch (err) {
        console.error('[SOP Recorder] content script error:', err);
      }
    }
  },
});
