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

    switch (event.type) {
        case 'customer.subscription.created': {
            handleCreateSubscription({ subscription: stripeSubscription })
            break
        }

        case 'customer.subscription.updated': {
            handleUpdateSubscription({ subscription: stripeSubscription })
            break
        }

        case 'customer.subscription.deleted': {
            handleDeleteSubscription({ subscription: stripeSubscription })

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
    const clerkUserId = subscription.metadata.clerkUserId

    if (!tier || !clerkUserId) {
        return NextResponse.json({ message: 'Error: Tier or clerk user id not found.' }, { status: 500 })
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
function handleUpdateSubscription({ subscription }: { subscription: Stripe.Subscription }) {}
function handleDeleteSubscription({ subscription }: { subscription: Stripe.Subscription }) {}
