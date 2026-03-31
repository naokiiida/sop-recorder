import type { BackgroundToPanelMessage, PanelMessage } from '../types.js';
import type { IMessageBus, PanelPort } from '../../adapters/interfaces/index.js';
import { Logger } from '../logger.js';

/**
 * Service responsible for managing the connection and communication
 * with the side panel.
 */
export class MessagingService {
  private activePanelPort: PanelPort | null = null;
  private messageBus: IMessageBus;

  constructor(messageBus: IMessageBus) {
    this.messageBus = messageBus;
  }

  /**
   * Start listening for panel connections.
   * @param onMessage Handler for messages received from the panel.
   * @param onConnect Optional callback when a new panel connects.
   */
  listen(
    onMessage: (message: PanelMessage) => void,
    onConnect?: (port: PanelPort) => void,
  ): void {
    this.messageBus.onPanelConnect((port) => {
      Logger.info('MessagingService', 'Panel connected');
      this.activePanelPort = port;

      port.onMessage((message) => {
        onMessage(message);
      });

      port.onDisconnect(() => {
        Logger.info('MessagingService', 'Panel disconnected');
        this.activePanelPort = null;
      });

      if (onConnect) {
        onConnect(port);
      }
    });
  }

  /**
   * Send a message to the currently active panel, if any.
   */
  postMessage(message: BackgroundToPanelMessage): void {
    if (this.activePanelPort) {
      this.activePanelPort.postMessage(message);
    }
  }

  /**
   * Check if a panel is currently connected.
   */
  isPanelConnected(): boolean {
    return this.activePanelPort !== null;
  }
}
