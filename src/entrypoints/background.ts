export default defineBackground(() => {
  console.log('SOP Recorder background service worker started.');

  // Open side panel when extension icon is clicked
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

  // Listen for keyboard shortcut
  browser.commands.onCommand.addListener((command) => {
    if (command === 'toggle-recording') {
      console.log('Toggle recording shortcut triggered');
    }
  });
});
