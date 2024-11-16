'use server'

import { ProductDetails, productDetailsSchema } from '@/lib/schemas/product'
import { auth } from '@clerk/nextjs/server'
import { createProduct, deleteProduct, editProduct } from '../services/product-service'
import { redirect } from 'next/navigation'
import { Product } from '@/drizzle/types/table-types'
import { ProductTable } from '@/drizzle/schema'

export type ActionReturnType = Promise<
    | {
          error: boolean
          message: string
      }
    | undefined
>

export async function createProductAction({ createdProduct }: { createdProduct: ProductDetails }): ActionReturnType {
    const { userId } = await auth()

    if (!userId) {
        return {
            error: true,
            message: 'You must be logged in to create a product',
        }
    }

    const { success, data } = productDetailsSchema.safeParse(createdProduct)

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

export async function editProductAction({
    productId,
    editedProduct,
}: {
    productId: Product['id']
    editedProduct: Partial<typeof ProductTable.$inferInsert>
}) {
    const { userId } = await auth()

    if (!userId) {
        return {
            error: true,
            message: 'You must be logged in to edit a product',
        }
    }

    const { success, data } = productDetailsSchema.safeParse(editedProduct)

    if (!success) {
        return { error: true, message: 'Invalid product data' }
    }

    await editProduct({
        userId,
        productId,
        product: data,
    })

    return {
        error: false,
        message: 'Product updated successfully',
    }
}

export async function deleteProductAction({ productId }: { productId: Product['id'] }): ActionReturnType {
    const { userId } = await auth()

    if (!userId) {
        return {
            error: true,
            message: 'You must be logged in to delete a product',
        }
    }

    const isSuccess = await deleteProduct({ productId, userId })

    return {
        error: !isSuccess,
        message: isSuccess ? 'Product deleted successfully' : 'Error deleting product',
    }
}
