import { ProductGrid } from '@/features/dashboard/product-grid'
import { Button } from '@/lib/components/button'
import { getProducts } from '@/server/services/product-service'
import { NoProducts } from '@/shared/common/no-products'
import { auth } from '@clerk/nextjs/server'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'

export default async function Products() {
    const { userId, redirectToSignIn } = await auth()
    if (userId == null) return redirectToSignIn()

    const products = await getProducts({ userId })
    if (products.length === 0) return <NoProducts />

    return (
        <>
            <h1 className='mb-6 text-3xl font-semibold flex justify-between'>
                Products
                <Button asChild>
                    <Link href='/dashboard/products/new'>
                        <PlusIcon className='size-4 mr-2' /> New Product
                    </Link>
                </Button>
            </h1>
            <ProductGrid products={products} />
        </>
    )
}
