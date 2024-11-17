'use server'

import { PaidTierNames, subscriptionTiers } from '@/lib/data/subscription-tiers'
import { currentUser, User } from '@clerk/nextjs/server'
import { getUserSubscription } from '../services/subscription-service'
import { Stripe } from 'stripe'
import { serverEnv } from '@/lib/data/env/server-env'
import { clientEnv } from '@/lib/data/env/client-env'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY)

export async function createCancelSession() {
    const user = await currentUser()
    if (!user) return { error: true }

    const subscription = await getUserSubscription({ userId: user.id })
    if (!subscription) return { error: true }
    if (!subscription?.stripeSubscriptionId || !subscription?.stripeCustomerId) {
        return NextResponse.json({ error: 'No stripe subscription id or customer id' }, { status: 500 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/subscription`,
        flow_data: {
            type: 'subscription_cancel',
            subscription_cancel: {
                subscription: subscription.stripeSubscriptionId,
            },
        },
    })

    if (!portalSession?.url) {
        return { error: true }
    }

    redirect(portalSession?.url)
}
export async function createCustomerPortalSession() {}

export async function createCheckoutSession({ tier }: { tier: PaidTierNames }) {
    const user = await currentUser()
    if (!user) {
        return { error: true }
    }

    const userSubscription = await getUserSubscription({ userId: user.id })
    if (!userSubscription) {
        return { error: true }
    }

    if (!userSubscription?.stripeCustomerId) {
        const url = await getCheckoutSession({ tier, user })
        if (!url) {
            return { error: true }
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
            return { error: true }
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

    // 특정 고객을 위한 고객 포털의 “1회 방문”을 설정하는 세션
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


