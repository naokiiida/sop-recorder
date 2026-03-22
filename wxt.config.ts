import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifestVersion: 3,
  manifest: {
    name: 'nuknow',
    description:
      'Record browser interactions and produce documented SOPs with annotated screenshots.',
    icons: {
      16: '/icons/icon-16.png',
      32: '/icons/icon-32.png',
      48: '/icons/icon-48.png',
      128: '/icons/icon-128.png',
    },
    action: {
      default_icon: {
        16: '/icons/icon-16.png',
        32: '/icons/icon-32.png',
        48: '/icons/icon-48.png',
        128: '/icons/icon-128.png',
      },
    },
    permissions: ['activeTab', 'tabs', 'scripting', 'storage', 'sidePanel', 'alarms', 'downloads'],
    commands: {
      'toggle-recording': {
        suggested_key: {
          default: 'Alt+Shift+R',
        },
        description: 'Start or stop recording',
      },
    },
  },
});
