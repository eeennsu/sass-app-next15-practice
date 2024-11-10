'use client'

import {
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/lib/components/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useTransition } from 'react'
import { deleteProductAction } from '@/server/actions/product'

export function DeleteProductAlertDialogContent({ id }: { id: string }) {
    const [isDeletePending, startDeleteTransition] = useTransition()
    const { toast } = useToast()

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    this product.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={() => {
                        startDeleteTransition(async () => {
                            const data = await deleteProductAction({
                                productId: id,
                            })
                            if (data?.message) {
                                toast({
                                    title: data?.error ? 'Error' : 'Success',
                                    description: data?.message,
                                    variant: data?.error
                                        ? 'destructive'
                                        : 'default',
                                })
                            }
                        })
                    }}
                    disabled={isDeletePending}
                >
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}
