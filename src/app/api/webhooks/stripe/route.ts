import { UserSubscriptionTable } from '@/drizzle/schema'
import { serverEnv } from '@/lib/data/env/server-env'
import { getTierByPriceId } from '@/lib/data/subscription-tiers'
import { updateUserSubscription } from '@/server/services/subscription-service'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY)

export async function POST(request: NextRequest) {
    const event = stripe.webhooks.constructEvent(
        await request.text(),
        request.headers.get('stripe-signature') as string,
        serverEnv.STRIPE_WEBHOOK_SECRET
    )

    const stripeSubscription = event?.data?.object as Stripe.Subscription

    console.log('event.type', event.type)

    switch (event.type) {
        case 'customer.subscription.created': {
            await handleCreateSubscription({ subscription: stripeSubscription })
            break
        }

        case 'customer.subscription.updated': {
            await handleUpdateSubscription({ subscription: stripeSubscription })
            break
        }

        case 'customer.subscription.deleted': {
            await handleDeleteSubscription({ subscription: stripeSubscription })

            break
        }
    }

    return NextResponse.json(null)
}

async function handleCreateSubscription({ subscription }: { subscription: Stripe.Subscription }) {
    const stripePriceId = subscription.items.data.at(0)?.price.id
    if (!stripePriceId) {
        throw new Error('No stripe price id')
    }

    const tier = getTierByPriceId({ stripePriceId })
    if (!tier) {
        throw new Error('No tier')
    }

    const clerkUserId = subscription.metadata.clerkUserId
    if (!clerkUserId) {
        throw new Error('No clerk user id')
    }

    const customer = subscription.customer
    const customerId = typeof customer === 'string' ? customer : customer.id

    const editedUserSubscriptionData: Partial<typeof UserSubscriptionTable.$inferInsert> = {
        tier: tier.name,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionItemId: subscription.items.data.at(0)?.id,
    }

    return await updateUserSubscription({
        userSubscription: editedUserSubscriptionData,
        whereSQL: eq(UserSubscriptionTable.clerkUserId, clerkUserId),
    })
}
async function handleUpdateSubscription({ subscription }: { subscription: Stripe.Subscription }) {
    const customer = subscription.customer
    const customerId = typeof customer === 'string' ? customer : customer.id
    let editedUserSubscriptionData: Partial<typeof UserSubscriptionTable.$inferInsert> = {}

    if (subscription.cancel_at_period_end) {
        editedUserSubscriptionData = {
            tier: 'Free',
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            stripeSubscriptionItemId: null,
        }

        return await updateUserSubscription({
            userSubscription: editedUserSubscriptionData,
            whereSQL: eq(UserSubscriptionTable.stripeCustomerId, customerId),
        })
    } else {
        const stripePriceId = subscription.items.data.at(0)?.price.id

        if (!stripePriceId) {
            throw new Error('No stripe price id')
        }

        const tier = getTierByPriceId({ stripePriceId })
        if (!tier) {
            throw new Error('No tier')
        }

        editedUserSubscriptionData = {
            tier: tier.name,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionItemId: subscription.items.data.at(0)?.id,
        }

        return await updateUserSubscription({
            userSubscription: editedUserSubscriptionData,
            whereSQL: eq(UserSubscriptionTable.stripeCustomerId, customerId),
        })
    }
}
async function handleDeleteSubscription({ subscription }: { subscription: Stripe.Subscription }) {
    const customer = subscription.customer
    const customerId = typeof customer === 'string' ? customer : customer.id

    return await updateUserSubscription({
        userSubscription: {
            tier: 'Free',
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            stripeSubscriptionItemId: null,
        },
        whereSQL: eq(UserSubscriptionTable.stripeCustomerId, customerId),
    })
}
