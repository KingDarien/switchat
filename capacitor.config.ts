import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9e03f853bc0e4597a95304a98b5b4e9a',
  appName: 'ascend-social',
  webDir: 'dist',
  server: {
    url: 'https://9e03f853-bc0e-4597-a953-04a98b5b4e9a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;