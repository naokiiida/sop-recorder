import type { IMessageBus, PanelPort } from '../interfaces/index.js';
import type {
  ContentMessage,
  BackgroundToPanelMessage,
  PanelMessage,
} from '../../core/types.js';

/**
 * Chrome Message Bus — routes messages between content scripts and side panel.
 */
export class ChromeMessageBus implements IMessageBus {
  onContentMessage(handler: (message: ContentMessage, tabId: number) => void): void {
    browser.runtime.onMessage.addListener(
      (message: unknown, sender: Browser.runtime.MessageSender) => {
        const msg = message as ContentMessage;
        if (msg.type === 'STEP_CAPTURED' || msg.type === 'CONTENT_READY') {
          const tabId = sender.tab?.id ?? -1;
          handler(msg, tabId);
        }
      },
    );
  }

  onPanelConnect(handler: (port: PanelPort) => void): void {
    browser.runtime.onConnect.addListener((rawPort: Browser.runtime.Port) => {
      if (rawPort.name !== 'sidepanel') return;

      const port: PanelPort = {
        postMessage(message: BackgroundToPanelMessage): void {
          rawPort.postMessage(message);
        },
        onMessage(msgHandler: (message: PanelMessage) => void): void {
          rawPort.onMessage.addListener((msg: unknown) => {
            msgHandler(msg as PanelMessage);
          });
        },
        onDisconnect(disconnectHandler: () => void): void {
          rawPort.onDisconnect.addListener(disconnectHandler);
        },
      };

      handler(port);
    });
  }
}
