import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { serverEnv } from '@/lib/data/env/server-env'
import {
    createUserSubscription,
    deleteUser,
} from '@/server/queries/subscription'

export async function POST(req: Request) {
    const headerPayload = await headers()

    const svixId = headerPayload.get('svix-id')
    const svixTimestamp = headerPayload.get('svix-timestamp')
    const svixSignature = headerPayload.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
        return new Response('Error occured -- no svix headers', {
            status: 400,
        })
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
        return new Response('Error occured', {
            status: 400,
        })
    }

    switch (event.type) {
        case 'user.created':
            if (!event.data?.id) {
                console.error('Error occured -- no user id')
                return
            }

            await createUserSubscription({
                clerkUserId: event.data.id,
                tier: 'Free',
            })

            break

        case 'user.deleted':
            if (!event.data?.id) {
                console.error('Error occured -- no user id')
                return
            }

            await deleteUser({ clerkUserId: event.data.id })

            // TODO: remove stripe subscription

            break
    }

    return new Response('', { status: 200 })
}
