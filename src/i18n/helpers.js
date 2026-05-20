import { I18N_KEYS } from "./keys";

/**
 * t('ADS00001', 'ADS00001-{{title}}를(을) 선택하세요', { title })
 * @param {Function} t - useTranslation().t
 * @param {string} title - 필드명 (이미 번역된 문자열)
 */
export const tSelectPlaceholder = (t, title) => {
  return t(
    I18N_KEYS.SELECT_PLACEHOLDER,
    "ADS00001-{{title}}를(을) 선택하세요",
    { title },
  );
};

/**
 * 라벨 키로 필드명을 번역한 뒤 선택 placeholder 생성
 * @param {Function} t
 * @param {string} titleKey - 예: I18N_KEYS.USAGE
 * @param {string} titleDefault - 예: '용도'
 */
export const tSelectPlaceholderByLabelKey = (t, titleKey, titleDefault) => {
  const title = t(titleKey, titleDefault);
  return tSelectPlaceholder(t, title);
};
