import { I18n } from 'i18n-js';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import en from './en.json';
import ar from './ar.json';

class LanguageManager {
  private i18n: I18n;
  private currentLocale: string = 'en';

  constructor() {
    this.i18n = new I18n({
      en,
      ar,
    });

    this.i18n.defaultLocale = 'en';
    this.i18n.enableFallback = true;
    this.initializeLanguage();
  }

  private async initializeLanguage() {
    try {
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      if (savedLanguage) {
        this.setLanguage(savedLanguage);
      } else {
        const deviceLanguage = RNLocalize.getLocales()[0]?.languageCode || 'en';
        this.setLanguage(deviceLanguage === 'ar' ? 'ar' : 'en');
      }
    } catch (error) {
      console.log('Error initializing language:', error);
    }
  }

  setLanguage(language: string) {
    this.currentLocale = language;
    this.i18n.locale = language;
    const isRTL = language === 'ar';
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    AsyncStorage.setItem('selectedLanguage', language);
  }

  getCurrentLanguage() {
    return this.currentLocale;
  }

  isRTL() {
    return this.currentLocale === 'ar';
  }

  t(key: string, options?: any) {
    return this.i18n.t(key, options);
  }
}

export default new LanguageManager();
