import { db } from '@/drizzle/db'
import { ProductTable, UserSubscriptionTable } from '@/drizzle/schema'
import { CACHE_TAGS, revalidateDbCache } from '@/lib/actions/cache'
import { eq } from 'drizzle-orm'

export async function createUserSubscription(userSubscription: typeof UserSubscriptionTable.$inferInsert) {
    const [newUserSubscription] = await db
        .insert(UserSubscriptionTable)
        .values(userSubscription)
        .onConflictDoNothing({
            target: UserSubscriptionTable.clerkUserId,
        })
        .returning({
            id: UserSubscriptionTable.id,
            clerkUserId: UserSubscriptionTable.clerkUserId,
        })

    if (!!newUserSubscription) {
        revalidateDbCache({
            tag: CACHE_TAGS.userSubscription,
            id: newUserSubscription.clerkUserId,
            userId: newUserSubscription.clerkUserId,
        })
    }

    return newUserSubscription
}

export async function deleteUser({ userId }: { userId: string }) {
    // 여러 데이터베이스 작업을 한 번에 묶어서 실행할 수 있게 해주는 기능이다. 데이터베이스에 여러 개의 쿼리를 보내야 할 때, 각 쿼리를 따로따로 실행하지 않고 하나의 그룹(batch)로 묶어서 실행할 수 있다. 이를 통해 여러 쿼리가 동시에 실행되므로, 성능이 개선되고 데이터베이스에 대한 네트워크 요청을 줄일 수 있다.
    // 또한 batch는 트랜잭션 내에서 실행되어 모든 작업이 성공할 때만 커밋되고, 하나라도 실패하면 롤백되는 방식으로 안전하게 처리됨.
    const [userSubscriptions, products] = await db.batch([
        db.delete(UserSubscriptionTable).where(eq(UserSubscriptionTable.clerkUserId, userId)).returning({
            id: UserSubscriptionTable.id,
        }),
        db.delete(ProductTable).where(eq(ProductTable.clerkUserId, userId)).returning({
            id: ProductTable.id,
        }),
    ])

    for (const userSubscription of userSubscriptions) {
        revalidateDbCache({
            tag: CACHE_TAGS.userSubscription,
            id: userSubscription.id,
            userId,
        })
    }

    for (const product of products) {
        revalidateDbCache({
            tag: CACHE_TAGS.products,
            id: product.id,
            userId,
        })
    }

    return [userSubscriptions, products]
}
