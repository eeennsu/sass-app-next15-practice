import { startOfMonth } from 'date-fns'
import { getUserSubscriptionTier } from './subscription-service'
import { getProductCount } from './product-service'

export async function canRemoveBranding({ userId }: { userId: string | null }) {
    if (userId == null) return false
    const tier = await getUserSubscriptionTier({ userId })
    return tier.canRemoveBranding
}

export async function canCustomizeBanner({ userId }: { userId: string | null }) {
    if (userId == null) return false
    const tier = await getUserSubscriptionTier({ userId })
    return tier.canCustomizeBanner
}

export async function canAccessAnalytics({ userId }: { userId: string | null }) {
    if (userId == null) return false
    const tier = await getUserSubscriptionTier({ userId })
    return tier.canAccessAnalytics
}

export async function canCreateProduct({ userId }: { userId: string | null }) {
    if (userId == null) return false
    const tier = await getUserSubscriptionTier({ userId })
    const productCount = await getProductCount({ userId })
    return productCount < tier.maxNumberOfProducts
}

// export async function canShowDiscountBanuserIdner(userId: string | null) {
//     if (userId == null) return false
//     const tier = await getUserSubscriptionTier(userId)
//     const productViews = await getProductViewCount(userId, startOfMonth(new Date()))
//     return productViews < tier.maxNumberOfVisits
// }
