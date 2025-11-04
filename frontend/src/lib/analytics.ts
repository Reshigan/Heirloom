export interface AnalyticsEvent {
  name: string
  properties?: Record<string, unknown>
}

class Analytics {
  private enabled: boolean

  constructor() {
    this.enabled = !!process.env.NEXT_PUBLIC_ANALYTICS_ID
  }

  track(event: AnalyticsEvent) {
    if (!this.enabled) {
      console.log('[Analytics - Dev Mode]', event.name, event.properties)
      return
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.name, event.properties)
    }
  }

  page(path: string) {
    if (!this.enabled) {
      console.log('[Analytics - Dev Mode] Page view:', path)
      return
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_ANALYTICS_ID, {
        page_path: path,
      })
    }
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    if (!this.enabled) {
      console.log('[Analytics - Dev Mode] Identify:', userId, traits)
      return
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('set', { user_id: userId, ...traits })
    }
  }
}

export const analytics = new Analytics()

export const trackMemoryCreated = (memoryType: string) => {
  analytics.track({
    name: 'memory_created',
    properties: { memory_type: memoryType }
  })
}

export const trackTokenGenerated = () => {
  analytics.track({
    name: 'token_generated',
    properties: {}
  })
}

export const trackTokenRedeemed = (tokenId: string) => {
  analytics.track({
    name: 'token_redeemed',
    properties: { token_id: tokenId }
  })
}

export const trackVaultUnsealed = (userId: string) => {
  analytics.track({
    name: 'vault_unsealed',
    properties: { user_id: userId }
  })
}

export const trackExecutorInvited = (executorEmail: string) => {
  analytics.track({
    name: 'executor_invited',
    properties: { executor_email: executorEmail }
  })
}

export const trackPaymentCompleted = (plan: string, amount: number) => {
  analytics.track({
    name: 'payment_completed',
    properties: { plan, amount }
  })
}

export const trackAIFeatureUsed = (feature: string) => {
  analytics.track({
    name: 'ai_feature_used',
    properties: { feature }
  })
}
