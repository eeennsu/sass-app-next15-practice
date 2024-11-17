import { serverEnv } from './env/server-env'

export type TierNames = keyof typeof subscriptionTiers
export type PaidTierNames = Exclude<TierNames, 'Free'>

export const subscriptionTiers = {
    Free: {
        name: 'Free',
        priceInCents: 0,
        maxNumberOfProducts: 1,
        maxNumberOfVisits: 5000,
        canAccessAnalytics: false,
        canCustomizeBanner: false,
        canRemoveBranding: false,
        stripePriceId: null,
    },
    Basic: {
        name: 'Basic',
        priceInCents: 1900,
        maxNumberOfProducts: 5,
        maxNumberOfVisits: 10000,
        canAccessAnalytics: true,
        canCustomizeBanner: false,
        canRemoveBranding: true,
        stripePriceId: serverEnv.STRIPE_BASIC_PLAN_STRIPE_PRICE_ID,
    },
    Standard: {
        name: 'Standard',
        priceInCents: 4900,
        maxNumberOfProducts: 30,
        maxNumberOfVisits: 100000,
        canAccessAnalytics: true,
        canCustomizeBanner: true,
        canRemoveBranding: true,
        stripePriceId: serverEnv.STRIPE_STANDARD_PLAN_STRIPE_PRICE_ID,
    },
    Premium: {
        name: 'Premium',
        priceInCents: 9900,
        maxNumberOfProducts: 50,
        maxNumberOfVisits: 1000000,
        canAccessAnalytics: true,
        canCustomizeBanner: true,
        canRemoveBranding: true,
        stripePriceId: serverEnv.STRIPE_PREMIUM_PLAN_STRIPE_PRICE_ID,
    },
} as const

export const subscriptionTiersInOrder = [
    subscriptionTiers.Free,
    subscriptionTiers.Basic,
    subscriptionTiers.Standard,
    subscriptionTiers.Premium,
] as const

export type SubscriptionTier = (typeof subscriptionTiersInOrder)[number]

export function getTierByPriceId({ stripePriceId }: { stripePriceId: string }) {
    return Object.values(subscriptionTiers).find((tier) => tier.stripePriceId === stripePriceId)
}
