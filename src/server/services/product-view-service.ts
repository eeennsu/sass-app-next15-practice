import { db } from '@/drizzle/db'
import { ProductTable, ProductViewTable } from '@/drizzle/schema'
import { CACHE_TAGS, dbCache, getUserTag } from '@/lib/utils/cache'
import { and, count, eq, gte } from 'drizzle-orm'

export async function getProductViewCount({ userId, startDate }: { userId: string; startDate: Date }) {
    const cachedFn = dbCache(getProductViewCountInternal, {
        tags: [getUserTag({ tag: CACHE_TAGS.productViews, userId })],
    })

    return cachedFn({ userId, startDate })
}

async function getProductViewCountInternal({ userId, startDate }: Parameters<typeof getProductViewCount>[0]) {
    const query = await db
        .select({ pricingViewCount: count() })
        .from(ProductViewTable)
        .innerJoin(ProductTable, eq(ProductTable.id, ProductViewTable.productId))
        .where(and(eq(ProductTable.clerkUserId, userId), gte(ProductViewTable.visitedAt, startDate)))

    return query.at(0)?.pricingViewCount ?? 0
}
