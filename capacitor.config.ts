import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ashbi.kiddraw',
  appName: 'Kid Draw',
  webDir: 'dist',
  ios: {
    backgroundColor: '#FFFAF0',
    preferredContentMode: 'mobile'
  },
  android: {
    backgroundColor: '#FFFAF0'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#FFFAF0',
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
