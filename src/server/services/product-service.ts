import { db } from '@/drizzle/db'
import { ProductCustomizationTable, ProductTable } from '@/drizzle/schema'
import { Product } from '@/drizzle/types/table-types'
import { CACHE_TAGS, dbCache, getGlobalTag, getIdTag, getUserTag, revalidateDbCache } from '@/lib/actions/cache'
import { and, eq } from 'drizzle-orm'

export function getProducts({ userId, limit = 10 }: { userId: string; limit?: number }) {
    const cachedFn = dbCache(getProductsInternal, {
        tags: [getUserTag({ userId, tag: 'products' })],
    })

    return cachedFn({ userId, limit })
}

function getProductsInternal({ userId, limit }: { userId: string; limit: number }) {
    return db.query.ProductTable.findMany({
        where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
        orderBy: ({ createdAt }, { desc }) => desc(createdAt),
        limit,
    })
}

export async function createProduct({ product }: { product: typeof ProductTable.$inferInsert }) {
    const [newProduct] = await db.insert(ProductTable).values(product).returning({
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

export async function deleteProduct({ productId, userId }: { productId: Product['id']; userId: string }) {
    const { rowCount } = await db
        .delete(ProductTable)
        .where(and(eq(ProductTable.id, productId), eq(ProductTable.clerkUserId, userId)))

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

export async function getProduct({ productId, userId }: { productId: Product['id']; userId: string }) {
    const cachedFn = dbCache(getProductInternal, {
        tags: [getIdTag({ tag: CACHE_TAGS.products, id: productId })],
    })

    return cachedFn({ productId, userId })
}

export function getProductInternal({ productId, userId }: { productId: Product['id']; userId: string }) {
    return db.query.ProductTable.findFirst({
        where: ({ id, clerkUserId }, { eq, and }) => and(eq(id, productId), eq(clerkUserId, userId)),
    })
}

export async function editProduct({
    productId,
    product,
    userId,
}: {
    productId: Product['id']
    userId: string
    product: Partial<typeof ProductTable.$inferInsert>
}) {
    const { rowCount } = await db
        .update(ProductTable)
        .set(product)
        .where(and(eq(ProductTable.id, productId), eq(ProductTable.clerkUserId, userId)))

    const isUpdated = rowCount > 0

    if (isUpdated) {
        revalidateDbCache({
            tag: CACHE_TAGS.products,
            userId,
            id: productId,
        })
    }
}

export function getProductCountryGroups({ productId, userId }: { productId: Product['id']; userId: string }) {
    const cachedFn = dbCache(getProductCountryGroupsInternal, {
        tags: [
            getIdTag({ id: productId, tag: CACHE_TAGS.products }),
            getGlobalTag({ tag: CACHE_TAGS.countries }),
            getGlobalTag({ tag: CACHE_TAGS.countryGroups }),
        ],
    })

    return cachedFn({ productId, userId })
}

async function getProductCountryGroupsInternal({ productId, userId }: { productId: Product['id']; userId: string }) {
    const product = await getProduct({ productId, userId })

    if (!product) return []

    const countryGroups = await db.query.CountryGroupTable.findMany({
        with: {
            countries: {
                columns: {
                    name: true,
                    code: true,
                },
            },
            countryGroupDiscounts: {
                columns: {
                    coupon: true,
                    discountPercentage: true,
                },
                where: ({ productId: countryGroupProductId }, { eq }) => eq(countryGroupProductId, productId),
            },
        },
    })

    return countryGroups.map((countryGroup) => ({
        id: countryGroup.id,
        name: countryGroup.name,
        recommendedDiscountPercentage: countryGroup.recommendedDiscountPercentage,
        countries: countryGroup.countries,
        discount: countryGroup.countryGroupDiscounts.at(0),
    }))
}
