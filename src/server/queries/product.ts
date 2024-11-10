import { db } from '@/drizzle/db'
import { ProductCustomizationTable, ProductTable } from '@/drizzle/schema'
import {
    CACHE_TAGS,
    dbCache,
    getUserTag,
    revalidateDbCache,
} from '@/lib/actions/cache'
import { and, eq } from 'drizzle-orm'

export function getProducts({
    userId,
    limit = 10,
}: {
    userId: (typeof ProductTable.$inferSelect)['clerkUserId']
    limit?: number
}) {
    const cachedFn = dbCache(getProductsInternal, {
        tags: [getUserTag({ userId, tag: 'products' })],
    })

    return cachedFn({ userId, limit })
}

function getProductsInternal({
    userId,
    limit,
}: {
    userId: (typeof ProductTable.$inferSelect)['clerkUserId']
    limit: number
}) {
    return db.query.ProductTable.findMany({
        where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
        orderBy: ({ createdAt }, { desc }) => desc(createdAt),
        limit,
    })
}

export async function createProduct({
    product,
}: {
    product: typeof ProductTable.$inferInsert
}) {
    const [newProduct] = await db
        .insert(ProductTable)
        .values(product)
        .returning({
            id: ProductTable.id,
            clerkUserId: ProductTable.clerkUserId,
        })

    try {
        await db
            .insert(ProductCustomizationTable)
            .values({
                productId: newProduct.id,
            })
            .onConflictDoNothing({
                target: ProductCustomizationTable.productId,
            })
    } catch (error) {
        console.log('Error creating product customization:', error)
        await db.delete(ProductTable).where(eq(ProductTable.id, newProduct.id))
    }

    revalidateDbCache({
        tag: CACHE_TAGS.products,
        userId: newProduct.clerkUserId,
        id: newProduct.id,
    })

    return newProduct
}

export async function deleteProduct({
    productId,
    userId,
}: {
    productId: (typeof ProductTable.$inferSelect)['id']
    userId: (typeof ProductTable.$inferSelect)['clerkUserId']
}) {
    const { rowCount } = await db
        .delete(ProductTable)
        .where(
            and(
                eq(ProductTable.id, productId),
                eq(ProductTable.clerkUserId, userId),
            ),
        )

    const isDeleted = rowCount > 0

    if (isDeleted) {
        revalidateDbCache({
            tag: CACHE_TAGS.products,
            userId,
            id: productId,
        })
    }

    return isDeleted
}
