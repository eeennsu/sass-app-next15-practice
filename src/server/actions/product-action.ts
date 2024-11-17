'use server'

import {
    ProductCountryDiscountForm,
    productCountryDiscountsFormSchema,
    ProductCustomizationForm,
    productCustomizationSchema,
    ProductDetails,
    productDetailsSchema,
} from '@/lib/schemas/product-form'
import { auth } from '@clerk/nextjs/server'
import {
    createProduct,
    deleteProduct,
    editProduct,
    updateCountryDiscounts,
    updateProductCustomization,
} from '../services/product-service'
import { redirect } from 'next/navigation'
import { Product } from '@/drizzle/types/table-types'
import { CountryGroupDiscountTable, ProductTable } from '@/drizzle/schema'
import { canCreateProduct, canCustomizeBanner } from '../services/permission-service'

export type ActionReturnType = Promise<
    | {
          error: boolean
          message?: string
      }
    | undefined
>

export async function createProductAction({
    unSafeCreatedProduct,
}: {
    unSafeCreatedProduct: ProductDetails
}): ActionReturnType {
    const { userId } = await auth()

    if (!userId) {
        return {
            error: true,
            message: 'You must be logged in to create a product',
        }
    }

    const canCreate = await canCreateProduct({ userId })

    if (!canCreate) {
        return {
            error: true,
            message: 'You do not have permission to create a product',
        }
    }

    const { success, data } = productDetailsSchema.safeParse(unSafeCreatedProduct)

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

    const { success, data: safeProduct } = productDetailsSchema.safeParse(editedProduct)

    if (!success) {
        return { error: true, message: 'Invalid product data' }
    }

    await editProduct({
        userId,
        productId,
        product: safeProduct,
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

export async function updateCountryDiscountsAction({
    productId,
    unSafeCountryDiscountsForm,
}: {
    productId: Product['id']
    unSafeCountryDiscountsForm: ProductCountryDiscountForm
}): ActionReturnType {
    const { userId } = await auth()

    if (!userId) {
        return {
            error: true,
            message: 'You must be logged in to create a product',
        }
    }

    const { success, data: safeProductCountryDiscountForm } =
        productCountryDiscountsFormSchema.safeParse(unSafeCountryDiscountsForm)

    if (!success) {
        return { error: true, message: 'Invalid product data' }
    }

    const insert: (typeof CountryGroupDiscountTable.$inferInsert)[] = []
    const deleteIds: Array<{ countryGroupId: string }> = []

    for (const group of safeProductCountryDiscountForm.groups) {
        if (!!group.coupon && group.coupon.length > 0 && !!group.discountPercentage && group.discountPercentage > 0) {
            insert.push({
                productId,
                countryGroupId: group.countryGroupId,
                coupon: group.coupon,
                discountPercentage: group.discountPercentage,
            })
        } else {
            deleteIds.push({ countryGroupId: group.countryGroupId })
        }
    }

    await updateCountryDiscounts({ insertGroup: insert, deleteGroup: deleteIds, productId, userId })

    return { error: false, message: 'Country discounts saved' }
}

export async function updateProductCustomizationAction({
    productId,
    unsafeProductCustomization,
}: {
    productId: Product['id']
    unsafeProductCustomization: ProductCustomizationForm
}): ActionReturnType {
    const { userId } = await auth()

    if (!userId) {
        return {
            error: true,
            message: 'You must be logged in to create a product',
        }
    }

    const canCustomize = await canCustomizeBanner({ userId })

    if (!canCustomize) {
        return {
            error: true,
            message: 'You do not have permission to customize banners',
        }
    }

    const { success, data: productCustomization } = productCustomizationSchema.safeParse(unsafeProductCustomization)

    if (!success) {
        return { error: true, message: 'Invalid product data' }
    }

    await updateProductCustomization({ productId, userId, productCustomization })

    return { error: false, message: 'Product customization saved' }
}
