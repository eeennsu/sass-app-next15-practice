import { revalidateTag, unstable_cache } from 'next/cache'
import { cache } from 'react'

export type ValidTag = ReturnType<typeof getGlobalTag> | ReturnType<typeof getUserTag> | ReturnType<typeof getIdTag>

export const CACHE_TAGS = {
    products: 'products',
    productViews: 'productViews',
    userSubscription: 'userSubscription',
} as const

// 전역 범위에서 사용하는 캐시 태그
export function getGlobalTag({ tag }: { tag: keyof typeof CACHE_TAGS }) {
    return `global:${CACHE_TAGS[tag]}` as const
}

export function getUserTag({ userId, tag }: { userId: string; tag: keyof typeof CACHE_TAGS }) {
    return `user:${userId}-${CACHE_TAGS[tag]}` as const
}

export function getIdTag({ id, tag }: { id: string; tag: keyof typeof CACHE_TAGS }) {
    return `id:${id}-${CACHE_TAGS[tag]}` as const
}

export function clearFullCache() {
    revalidateTag('*')
}

export function dbCache<T extends (...args: any[]) => Promise<any>>(
    cb: Parameters<typeof unstable_cache<T>>[0],
    {
        tags = [],
    }: {
        tags: ValidTag[]
    }
) {
    // keyParts를 undefined로 지정하면, 캐시키가 함수의 인수에 의해 자동으로 생성됨
    // tags에 '*'를 추가하면, 전역 무효화를 할 수 있으며, revalidate('*') 가 있을 때, 전체 캐시를 무효화할 수 있다.
    return cache(
        unstable_cache(cb, undefined, {
            tags: [...tags, '*'],
            revalidate: 60 * 60,
        })
    )
}

export function revalidateDbCache({ tag, userId, id }: { tag: keyof typeof CACHE_TAGS; userId?: string; id?: string }) {
    revalidateTag(getGlobalTag({ tag })) // 전역 범위의 캐시를 무효화 ex) 전체 상품 목록
    userId && revalidateTag(getUserTag({ userId, tag })) // 사용자 단위 캐시 무효화 ex) 유저의 상품 (카트 등) 목록
    id && revalidateTag(getIdTag({ id, tag })) // 개별 항목 무효화 // ex) 상품 상세 정보
}
