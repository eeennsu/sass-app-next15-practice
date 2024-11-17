import { Button } from '@/lib/components/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/lib/components/card'
import { Progress } from '@/lib/components/progress'
import { subscriptionTiers, subscriptionTiersInOrder, TierNames } from '@/lib/data/subscription-tiers'
import { cn } from '@/lib/shadcn/shadcn-utils'
import { formatCompactNumber } from '@/lib/utils/string'
import { createCancelSession, createCheckoutSession } from '@/server/actions/stripe-action'
import { getProductCount } from '@/server/services/product-service'
import { getProductViewCount } from '@/server/services/product-view-service'
import { getUserSubscriptionTier } from '@/server/services/subscription-service'
import { auth } from '@clerk/nextjs/server'
import { startOfMonth } from 'date-fns'
import { CheckIcon } from 'lucide-react'
import { ReactNode } from 'react'

export default async function SubscriptionPage() {
    const { userId, redirectToSignIn } = await auth()

    if (!userId) {
        return redirectToSignIn()
    }

    const currentTier = await getUserSubscriptionTier({ userId })
    const productCount = await getProductCount({ userId })
    const pricingViewCount = await getProductViewCount({ userId, startDate: startOfMonth(new Date()) })

    return (
        <>
            <h1 className='mb-6 text-3xl font-semibold'>Your Subscription</h1>
            <div className='flex flex-col gap-8 mb-8'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-lg'>Monthly Usage</CardTitle>
                            <CardDescription>
                                {formatCompactNumber(pricingViewCount)} /{' '}
                                {formatCompactNumber(currentTier.maxNumberOfVisits)} pricing page visits this month
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Progress value={(pricingViewCount / currentTier.maxNumberOfVisits) * 100} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-lg'>Number of Products</CardTitle>
                            <CardDescription>
                                {productCount} / {currentTier.maxNumberOfProducts} products created
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Progress value={(productCount / currentTier.maxNumberOfProducts) * 100} />
                        </CardContent>
                    </Card>
                </div>
                {currentTier !== subscriptionTiers.Free && (
                    <Card>
                        <CardHeader>
                            <CardTitle>You are currently on the {currentTier.name} plan</CardTitle>
                            <CardDescription>
                                If you would like to upgrade, cancel, or change your payment method use the button
                                below.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* <form action={createCustomerPortalSession}>
                                <Button
                                    variant='accent'
                                    className='text-lg rounded-lg'
                                    size='lg'>
                                    Manage Subscription
                                </Button>
                            </form> */}
                        </CardContent>
                    </Card>
                )}
            </div>
            <div className='grid-cols-2 lg:grid-cols-4 grid gap-4 max-w-screen-xl mx-auto'>
                {subscriptionTiersInOrder.map((tier) => (
                    <PricingCard
                        key={tier.name}
                        currentTierName={currentTier.name}
                        {...tier}
                    />
                ))}
            </div>
        </>
    )
}

function PricingCard({
    name,
    priceInCents,
    maxNumberOfVisits,
    maxNumberOfProducts,
    canRemoveBranding,
    canAccessAnalytics,
    canCustomizeBanner,
    currentTierName,
}: (typeof subscriptionTiersInOrder)[number] & { currentTierName: TierNames }) {
    const isCurrent = currentTierName === name

    return (
        <Card
            className={cn(
                'shadow-none rounded-3xl overflow-hidden hover',
                isCurrent && 'ring-2 ring-offset-1 ring-slate-300'
            )}>
            <CardHeader>
                <div className='text-accent font-semibold mb-8'>{name}</div>
                <CardTitle className='text-xl font-bold'>${priceInCents / 100} /mo</CardTitle>
                <CardDescription>{formatCompactNumber(maxNumberOfVisits)} pricing page visits/mo</CardDescription>
            </CardHeader>
            <CardContent>
                {/* @ts-ignore */}
                <form action={name === 'Free' ? createCancelSession : createCheckoutSession.bind(null, { tier: name })}>
                    <Button
                        disabled={isCurrent}
                        className='text-lg w-full rounded-lg'
                        size='lg'>
                        {isCurrent ? 'Current' : 'Swap'}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className='flex flex-col gap-4 items-start'>
                <Feature className='font-bold'>
                    {maxNumberOfProducts} {maxNumberOfProducts === 1 ? 'product' : 'products'}
                </Feature>
                <Feature>PPP discounts</Feature>
                {canCustomizeBanner && <Feature>Banner customization</Feature>}
                {canAccessAnalytics && <Feature>Advanced analytics</Feature>}
                {canRemoveBranding && <Feature>Remove Easy PPP branding</Feature>}
            </CardFooter>
        </Card>
    )
}

function Feature({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <CheckIcon className='size-4 stroke-accent bg-accent/25 rounded-full p-0.5' />
            <span>{children}</span>
        </div>
    )
}
