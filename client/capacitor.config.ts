import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.aikon.maestroia',
  appName: 'MaestroIA',
  webDir: 'dist',
  server: {
    // En producción apunta al backend de Railway
    url: 'https://maestroia-app-production.up.railway.app',
    cleartext: false
  },
  android: {
    backgroundColor: '#0a0a0a'
  }
};

export default config;
