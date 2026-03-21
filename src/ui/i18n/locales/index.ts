import { registerTranslations } from '../index';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';
import { ja } from './ja';

export function initializeTranslations(): void {
  registerTranslations('en', en);
  registerTranslations('es', es);
  registerTranslations('fr', fr);
  registerTranslations('de', de);
  registerTranslations('ja', ja);
}
