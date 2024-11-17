import { db } from '@/drizzle/db'
import { CountryGroupDiscountTable, ProductCustomizationTable, ProductTable, ProductViewTable } from '@/drizzle/schema'
import { Product } from '@/drizzle/types/table-types'
import { ProductCustomizationForm } from '@/lib/schemas/product-form'
import { CACHE_TAGS, dbCache, getGlobalTag, getIdTag, getUserTag, revalidateDbCache } from '@/lib/utils/cache'
import { and, count, eq, gte, inArray, sql } from 'drizzle-orm'
import { BatchItem } from 'drizzle-orm/batch'

export function getProducts({ userId, limit = 10 }: { userId: string; limit?: number }) {
    const cachedFn = dbCache(getProductsInternal, {
        tags: [getUserTag({ userId, tag: 'products' })],
    })

    return cachedFn({ userId, limit })
}

function getProductsInternal({ userId, limit }: Parameters<typeof getProducts>[0]) {
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

export async function updateCountryDiscounts({
    insertGroup,
    deleteGroup,
    productId,
    userId,
}: {
    insertGroup: (typeof CountryGroupDiscountTable.$inferInsert)[]
    deleteGroup: Array<{ countryGroupId: string }>
    productId: Product['id']
    userId: string
}) {
    const product = await getProduct({ productId, userId })

    if (!product) return false

    const statements: BatchItem<'pg'>[] = []

    if (deleteGroup.length > 0) {
        const deleted = db.delete(CountryGroupDiscountTable).where(
            and(
                eq(CountryGroupDiscountTable.productId, productId),
                inArray(
                    CountryGroupDiscountTable.countryGroupId,
                    deleteGroup.map(({ countryGroupId }) => countryGroupId)
                )
            )
        )

        statements.push(deleted)
    }

    if (insertGroup.length > 0) {
        const inserted = db
            .insert(CountryGroupDiscountTable)
            .values(insertGroup)
            .onConflictDoUpdate({
                target: [CountryGroupDiscountTable.productId, CountryGroupDiscountTable.countryGroupId],
                set: {
                    coupon: sql.raw(`excluded.${CountryGroupDiscountTable.coupon.name}`),
                    discountPercentage: sql.raw(`excluded.${CountryGroupDiscountTable.discountPercentage.name}`),
                },
            })

        statements.push(inserted)
    }

    if (statements.length > 0) {
        await db.batch(statements as [BatchItem<'pg'>])
    }

    revalidateDbCache({
        tag: CACHE_TAGS.countryGroups,
        userId,
        id: productId,
    })
}

export async function getProductCustomization({ productId, userId }: { productId: Product['id']; userId: string }) {
    const cachedFn = dbCache(getProductCustomizationInternal, {
        tags: [getIdTag({ id: productId, tag: CACHE_TAGS.products })],
    })

    return cachedFn({ productId, userId })
}

async function getProductCustomizationInternal({ productId, userId }: Parameters<typeof getProductCustomization>[0]) {
    const product = await db.query.ProductTable.findFirst({
        where: ({ id, clerkUserId }) => and(eq(id, productId), eq(clerkUserId, userId)),
        with: {
            productCustomization: true,
        },
    })

    return product?.productCustomization
}

export async function updateProductCustomization({
    productCustomization,
    productId,
    userId,
}: {
    productCustomization: ProductCustomizationForm
    productId: Product['id']
    userId: string
}) {
    const product = await getProduct({ productId, userId })

    if (!product) return

    await db
        .update(ProductCustomizationTable)
        .set(productCustomization)
        .where(eq(ProductCustomizationTable.productId, productId))

    revalidateDbCache({
        tag: CACHE_TAGS.products,
        userId,
        id: productId,
    })
}

export async function getProductCount({ userId }: { userId: string }) {
    const cachedFn = dbCache(getProductCountInternal, { tags: [getUserTag({ tag: CACHE_TAGS.products, userId })] })

    return cachedFn({ userId })
}

async function getProductCountInternal({ userId }: Parameters<typeof getProductCount>[0]) {
    const query = await db
        .select({ productCount: count() })
        .from(ProductTable)
        .where(eq(ProductTable.clerkUserId, userId))

    return query.at(0)?.productCount ?? 0
}
