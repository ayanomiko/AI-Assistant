import { registerPlugin } from '@capacitor/core';

const WakeWord = registerPlugin('WakeWord', {
  web: {
    start:     async () => ({ success: false }),
    stop:      async () => ({ success: true }),
    isRunning: async () => ({ running: false }),
  },
});

export default WakeWord;
