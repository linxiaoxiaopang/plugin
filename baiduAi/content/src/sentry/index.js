import Vue from 'vue'
import router from '../router'
import * as Sentry from '@sentry/vue'
import { BrowserTracing } from '@sentry/tracing'

const sentryMappingList = {
  localdev: 'https://527ab7292296496a91790f66e3460a0b@sentry.forudesigns.cn/2',
  pet: 'https://eec40ce4bcda4bb397eb79126e36f78f@sentry.forudesigns.cn/3',
  sit: 'https://6bf6bfcc17f3463db61a2bc8d239e617@sentry.forudesigns.cn/4',
  test: 'https://c16b33ec8c0548ca8ea7e69fead71d01@sentry.forudesigns.cn/5',
  uat: 'https://cf28fd81efd74ef59ae477d2438664bc@sentry.forudesigns.cn/6',
  prd: 'https://99394de49bc2c8300ff2d86ffcebea09@sentry.zhengdingyunshang.com/5',
  pro: 'https://99394de49bc2c8300ff2d86ffcebea09@sentry.zhengdingyunshang.com/5',
  newprd: 'https://99394de49bc2c8300ff2d86ffcebea09@sentry.zhengdingyunshang.com/5'
}

const stage = process.env.VUE_APP_ENV_STAGE
const needSentry = ['localdev', 'pet', 'sit', 'test', 'uat', 'prd', 'pro', 'newprd'].includes(stage)
const isProduction = process.env.NODE_ENV === 'production'

if (needSentry && isProduction) {
  Sentry.init({
    Vue,
    dsn: sentryMappingList[stage],
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: [process.env.VUE_APP_BASE_URL]
      })
    ],
    beforeSend(event, hint) {
      const error = hint.originalException || {}
      Sentry.configureScope(function (scope) {
        scope.setLevel('error')
      })
      if (error && error.message && error.detailMessage) {
        event.exception.values[0].value = `message: ${error.message}\n detailMessage: ${error.detailMessage}`
      }
      event.tags.traceId = error.traceId
      return event
    },
    tracesSampleRate: 1.0
  })
}
