import { registerPlugin } from '@capacitor/core';

// Web fallback (no-op) — chỉ hoạt động thật trên Android APK
const webFallback = {
  start:     async () => ({ success: false, reason: 'web-only' }),
  stop:      async () => ({ success: false }),
  isRunning: async () => ({ running: false }),
};

const NativeFloatingBubble = registerPlugin('FloatingBubble', {
  web: webFallback,
});

export default NativeFloatingBubble;
