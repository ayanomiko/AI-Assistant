import { registerPlugin } from '@capacitor/core';

const AppWatcher = registerPlugin('AppWatcher', {
  web: {
    hasPermission:    async () => ({ granted: false }),
    requestPermission: async () => ({ opened: false }),
    start:            async () => ({ success: false }),
    stop:             async () => ({ success: true }),
    isRunning:        async () => ({ running: false }),
    getCurrentApp:    async () => ({}),
    getAppHistory:    async () => ({ list: [] }),
  },
});

export default AppWatcher;
