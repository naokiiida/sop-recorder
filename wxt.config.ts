import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifestVersion: 3,
  manifest: {
    name: 'SOP Recorder',
    description:
      'Record browser interactions and produce documented SOPs with annotated screenshots.',
    permissions: ['activeTab', 'scripting', 'storage', 'sidePanel', 'alarms', 'downloads'],
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
