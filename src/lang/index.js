import Vue from 'vue'
import VueI18n from 'vue-i18n'
import Cookies from 'js-cookie'
import elementEnLocale from 'element-ui/lib/locale/lang/en' // element-ui lang
import elementZhLocale from 'element-ui/lib/locale/lang/zh-CN' // element-ui lang
import elementEsLocale from 'element-ui/lib/locale/lang/es' // element-ui lang
import elementJaLocale from 'element-ui/lib/locale/lang/ja' // element-ui lang
import enLocale from './en'
import zhLocale from './zh'
import esLocale from './es'
import jaLocale from './ja'
import langJson from './lang'

Vue.use(VueI18n)

const messages = {
  en: {
    ...enLocale,
    ...elementEnLocale,
    ...langJson.en
  },
  zh: {
    ...zhLocale,
    ...elementZhLocale,
    ...langJson.zh
  },
  es: {
    ...esLocale,
    ...elementEsLocale,
    ...langJson.es
  },
  ja: {
    ...jaLocale,
    ...elementJaLocale,
    ...langJson.ja
  }
}

export function getLanguage() {
  const chooseLanguage = Cookies.get('language')
  if (chooseLanguage) return chooseLanguage

  // if has not choose language
  const language = (navigator.language || navigator.browserLanguage).toLowerCase()
  const locales = Object.keys(messages)
  for (const locale of locales) {
    if (language.indexOf(locale) > -1) {
      return locale
    }
  }
  return 'zh'
}

const i18n = new VueI18n({
  // set locale
  // options: en | zh | es
  locale: 'en',
  // set locale messages
  messages
})

export default i18n
