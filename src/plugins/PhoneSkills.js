import { registerPlugin } from '@capacitor/core';

const PhoneSkills = registerPlugin('PhoneSkills', {
  web: {
    makeCall: async ({ number }) => {
      window.open(`tel:${number}`);
      return { success: true };
    },
    sendSms: async ({ number, body }) => {
      window.open(`sms:${number}?body=${encodeURIComponent(body)}`);
      return { success: true };
    },
    setAlarm:  async () => ({ success: false }),
    openApp:   async () => ({ success: false }),
  },
});

export default PhoneSkills;
