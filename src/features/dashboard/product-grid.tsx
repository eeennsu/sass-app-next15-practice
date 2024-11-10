import { Button } from '@/lib/components/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/lib/components/card'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/lib/components/dropdown-menu'
import { Dialog, DialogTrigger } from '@/lib/components/dialog'
import { AlertDialog, AlertDialogTrigger } from '@/lib/components/alert-dialog'
import { DeleteProductAlertDialogContent } from './delete-product-alert-dialog-content'
import { AddToSiteProductModalContent } from './add-to-site-product-modal-content'

export function ProductGrid({
    products,
}: {
    products: {
        id: string
        name: string
        url: string
        description?: string | null
    }[]
}) {
    return (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {products.map((product) => (
                <ProductCard key={product.id} {...product} />
            ))}
        </div>
    )
}

export function ProductCard({
    id,
    name,
    url,
    description,
}: {
    id: string
    name: string
    url: string
    description?: string | null
}) {
    return (
        <Card>
            <CardHeader>
                <div className='flex gap-2 justify-between items-end'>
                    <CardTitle>
                        <Link href={`/dashboard/products/${id}/edit`}>
                            {name}
                        </Link>
                    </CardTitle>
                    <Dialog>
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant='outline'
                                        className='size-8 p-0'
                                    >
                                        <div className='sr-only'>
                                            Action Menu
                                        </div>
                                        <DotsHorizontalIcon className='size-4' />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/dashboard/products/${id}/edit`}
                                        >
                                            Edit
                                        </Link>
                                    </DropdownMenuItem>
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem>
                                            Add To Site
                                        </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DropdownMenuSeparator />
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem>
                                            Delete
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DeleteProductAlertDialogContent id={id} />
                        </AlertDialog>
                        <AddToSiteProductModalContent id={id} />
                    </Dialog>
                </div>
                <CardDescription>{url}</CardDescription>
            </CardHeader>
            {description && <CardContent>{description}</CardContent>}
        </Card>
    )
}
