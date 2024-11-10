'use server'

import { ProductDetails, productDetailsSchema } from '@/lib/schemas/product'
import { auth } from '@clerk/nextjs/server'
import { createProduct, deleteProduct } from '../queries/product'
import { redirect } from 'next/navigation'
import { ProductTable } from '@/drizzle/schema'
import { revalidatePath } from 'next/cache';

export type ActionReturnType = Promise<
    | {
          error: boolean
          message: string
      }
    | undefined
>

export async function createProductAction(
    unsafeProductData: ProductDetails,
): ActionReturnType {
    const { userId } = await auth()

    if (!userId) {
        return {
            error: true,
            message: 'You must be logged in to create a product',
        }
    }

    const { success, data } = productDetailsSchema.safeParse(unsafeProductData)

    if (!success) {
        return { error: true, message: 'Invalid product data' }
    }

    const { id: newProductId } = await createProduct({
        product: {
            ...data,
            clerkUserId: userId,
        },
    })

    redirect(`/dashboard/products/${newProductId}/edit?tab=countries`)
}

export async function deleteProductAction({
    productId,
}: {
    productId: (typeof ProductTable.$inferSelect)['id']
}): ActionReturnType {
    const { userId } = await auth()

    if (!userId) {
        return {
            error: true,
            message: 'You must be logged in to delete a product',
        }
    }

    const isSuccess = await deleteProduct({ productId, userId })

    revalidatePath('/dashboard/products')
    revalidatePath('/dashboard/products/edit')

    return {
        error: !isSuccess,
        message: isSuccess
            ? 'Product deleted successfully'
            : 'Error deleting product',
    }
}
