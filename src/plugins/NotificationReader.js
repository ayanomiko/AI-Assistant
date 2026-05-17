import { registerPlugin } from '@capacitor/core';

const NotificationReader = registerPlugin('NotificationReader', {
  web: {
    hasPermission:       async () => ({ granted: false }),
    requestPermission:   async () => {},
    getNotifications:    async () => ({ list: [] }),
    clearNotifications:  async () => {},
  },
});

export default NotificationReader;
