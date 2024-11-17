import { NoPermissionCard } from '@/features/dashboard/no-permission-card'
import { auth } from '@clerk/nextjs/server'
import { AwaitedReactNode } from 'react'

export async function HasPermission({
    permission,
    renderFallback = false,
    fallbackText,
    children,
}: {
    permission: ({ userId }: { userId: string | null }) => Promise<boolean>
    renderFallback?: boolean
    fallbackText?: string
    children: AwaitedReactNode
}) {
    const { userId } = await auth()
    const hasPermission = await permission({ userId })

    if (hasPermission) return children
    if (renderFallback) return <NoPermissionCard>{fallbackText}</NoPermissionCard>

    return null
}
