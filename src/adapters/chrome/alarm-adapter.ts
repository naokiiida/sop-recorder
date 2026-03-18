import type { IAlarmAdapter } from '../interfaces/index.js';

const KEEPALIVE_ALARM = 'sop-keepalive';
// 25 seconds in minutes (Chrome alarms minimum is ~0.5 min in production,
// but we set it to 25s which Chrome will round up to minimum)
const KEEPALIVE_PERIOD_MINUTES = 25 / 60;

/**
 * Chrome Alarm adapter — manages keepalive alarm to prevent
 * service worker termination during active recording.
 */
export class ChromeAlarmAdapter implements IAlarmAdapter {
  createKeepalive(): void {
    browser.alarms.create(KEEPALIVE_ALARM, {
      periodInMinutes: KEEPALIVE_PERIOD_MINUTES,
    });
  }

  clearKeepalive(): void {
    browser.alarms.clear(KEEPALIVE_ALARM);
  }

  onAlarm(handler: () => void): void {
    browser.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === KEEPALIVE_ALARM) {
        handler();
      }
    });
  }
}
