import Link from 'next/link'
import { Button } from '@/lib/components/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/lib/components/card'
import { ReactNode } from 'react'

export function NoPermissionCard({
    className,
    children = 'You do not have permission to perform this action. Try upgrading your account to access this feature.',
}: {
    className?: string
    children?: ReactNode
}) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className='text-xl'>Permission Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription>{children}</CardDescription>
            </CardContent>
            <CardFooter>
                <Button asChild>
                    <Link href='/dashboard/subscription'>Upgrade Account</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
