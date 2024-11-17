import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { serverEnv } from '@/lib/data/env/server-env'
import { createUserSubscription, deleteUser, getUserSubscription } from '@/server/services/subscription-service'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY)

export async function POST(req: Request) {
    const headerPayload = await headers()

    const svixId = headerPayload.get('svix-id')
    const svixTimestamp = headerPayload.get('svix-timestamp')
    const svixSignature = headerPayload.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json({ message: 'Error: no svix headers' }, { status: 400 })
    }

    const payload = await req.json()
    const body = JSON.stringify(payload)

    const wh = new Webhook(serverEnv.CLERK_WEBHOOK_SECRET)

    let event: WebhookEvent

    try {
        event = wh.verify(body, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err)
        return NextResponse.json(
            { message: 'Error: could not verify webhook' },
            {
                status: 400,
            }
        )
    }

    const eventDataId = event.data?.id

    if (!eventDataId) {
        console.error('Error -- no user id')
        return
    }

    switch (event.type) {
        case 'user.created':
            await createUserSubscription({
                userSubscription: {
                    clerkUserId: eventDataId,
                    tier: 'Free',
                },
            })

            break

        case 'user.deleted':
            const userSubscription = await getUserSubscription({ userId: eventDataId })

            if (!!userSubscription?.stripeSubscriptionId) {
                await stripe.subscriptions.cancel(userSubscription.stripeSubscriptionId)
            }

            await deleteUser({ userId: eventDataId })
            // TODO: remove stripe subscription

            break
    }

    return NextResponse.json(null)
}
