import { getProducts } from '@/server/queries/product'
import { auth } from '@clerk/nextjs/server'
import type { FC } from 'react'
import Link from 'next/link'
import { Button } from '@/lib/components/button'
import { ArrowRightIcon, PlusIcon } from 'lucide-react'
import { ProductGrid } from '@/features/dashboard/product-grid';

const Page: FC = async () => {
    const { userId, redirectToSignIn } = await auth()

    if (!userId) {
        return redirectToSignIn()
    }

    const products = await getProducts({ userId, limit: 6 })

    if (products.length === 0) {
        return <NoProducts />
    }

    return (
        <>
            <h2 className='mb-6 text-3xl font-semibold flex justify-between'>
                <Link
                    className='group flex gap-2 items-center hover:underline'
                    href='/dashboard/products'
                >
                    Products
                    <ArrowRightIcon className='group-hover:translate-x-1 transition-transform' />
                </Link>
                <Button asChild>
                    <Link href='/dashboard/products/new'>
                        <PlusIcon className='size-4 mr-2' />
                        New Product
                    </Link>
                </Button>
            </h2>
            <ProductGrid products={products} />
            <h2 className='mb-6 text-3xl font-semibold flex justify-between mt-12'>
                <Link
                    href='/dashboard/analytics'
                    className='flex gap-2 items-center hover:underline group'
                >
                    Analytics
                    <ArrowRightIcon className='group-hover:translate-x-1 transition-transform' />
                </Link>
            </h2>
            {/* <HasPermission permission={canAccessAnalytics} renderFallback>
                <AnalyticsChart userId={userId} />
            </HasPermission> */}
        </>
    )
}

export default Page

const NoProducts: FC = () => {
    return (
        <div className='mt-32 text-center text-balance'>
            <h1 className='text-4xl font-semibold mb-2'>
                You have no products
            </h1>
            <p className='mb-4'>
                Get started with PPP discounts by creating a product
            </p>
            <Button size='lg' asChild>
                <Link href='/dashboard/products/new'>Add Product</Link>
            </Button>
        </div>
    )
}
