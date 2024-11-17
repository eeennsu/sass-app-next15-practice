'use server'

import { PaidTierNames, subscriptionTiers } from '@/lib/data/subscription-tiers'
import { auth, currentUser, User } from '@clerk/nextjs/server'
import { getUserSubscription } from '../services/subscription-service'
import { Stripe } from 'stripe'
import { serverEnv } from '@/lib/data/env/server-env'
import { clientEnv } from '@/lib/data/env/client-env'
import { redirect } from 'next/navigation'

const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY)

export async function createCancelSession() {
    const user = await currentUser()
    if (!user) {
        throw new Error('No user')
    }

    const userSubscription = await getUserSubscription({ userId: user.id })
    if (!userSubscription) {
        throw new Error('No user subscription')
    }
    if (!userSubscription?.stripeSubscriptionId || !userSubscription?.stripeCustomerId) {
        throw new Error('No stripe subscription id or stripe customer id')
    }

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: userSubscription.stripeCustomerId,
        return_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
        flow_data: {
            type: 'subscription_cancel',
            subscription_cancel: {
                subscription: userSubscription.stripeSubscriptionId,
            },
        },
    })

    if (!portalSession?.url) {
        throw new Error('No portal session url')
    }

    redirect(portalSession?.url)
}

export async function createCustomerPortalSession() {
    const { userId } = await auth()
    if (!userId) throw new Error('No user')

    const userSubscription = await getUserSubscription({ userId })
    if (!userSubscription || !userSubscription?.stripeCustomerId)
        throw new Error('No user subscription or stripe customer id')

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: userSubscription.stripeCustomerId,
        return_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
    })

    if (!portalSession?.url) {
        throw new Error('No portal session url')
    }

    redirect(portalSession.url)
}

export async function createCheckoutSession({ tier }: { tier: PaidTierNames }) {
    const user = await currentUser()
    if (!user) {
        throw new Error('No user')
    }

    const userSubscription = await getUserSubscription({ userId: user.id })
    if (!userSubscription) {
        throw new Error('No user subscription')
    }

    if (!userSubscription?.stripeCustomerId) {
        const url = await getCheckoutSession({ tier, user })
        if (!url) {
            throw new Error('No url')
        }

        redirect(url)
    } else {
        const url = await getSubscriptionUpgradeSession({
            tier,
            subscription: {
                stripeCustomerId: userSubscription?.stripeCustomerId,
                stripeSubscriptionId: userSubscription?.stripeSubscriptionId,
                stripeSubscriptionItemId: userSubscription?.stripeSubscriptionItemId,
            },
        })

        if (!url) {
            throw new Error('No url')
        }

        redirect(url)
    }
}

async function getCheckoutSession({ tier, user }: { tier: PaidTierNames; user: User }) {
    const session = await stripe.checkout.sessions.create({
        subscription_data: {
            metadata: {
                clerkUserId: user.id,
            },
        },
        line_items: [
            {
                price: subscriptionTiers[tier].stripePriceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
        cancel_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
    })

    return session?.url
}

async function getSubscriptionUpgradeSession({
    tier,
    subscription,
}: {
    tier: PaidTierNames
    subscription: {
        stripeCustomerId: string | null
        stripeSubscriptionId: string | null
        stripeSubscriptionItemId: string | null
    }
}) {
    if (
        !subscription.stripeCustomerId ||
        !subscription.stripeSubscriptionId ||
        !subscription.stripeSubscriptionItemId
    ) {
        throw new Error('No stripe customer id, subscription id, or subscription item id')
    }

    // 특정 고객을 위한 고객 포털의 1회 방문을 설정하는 세션
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
        flow_data: {
            type: 'subscription_update_confirm',
            subscription_update_confirm: {
                subscription: subscription.stripeSubscriptionId,
                items: [
                    {
                        id: subscription.stripeSubscriptionItemId,
                        price: subscriptionTiers[tier].stripePriceId,
                        quantity: 1,
                    },
                ],
            },
        },
    })

    return portalSession?.url
}
