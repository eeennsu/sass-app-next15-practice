'use client'

import { SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/lib/components/form'
import { Input } from '@/lib/components/input'
import { Textarea } from '@/lib/components/textarea'
import { Button } from '@/lib/components/button'
import { useToast } from '@/hooks/use-toast'
import { ProductDetails, productDetailsSchema } from '@/lib/schemas/product'
import { RequiredLabelIcon } from '@/shared/icons/required-label'
import { createProductAction } from '@/server/actions/product'
// import { createProduct, updateProduct } from '@/server/actions/products'

export function ProductDetailsForm({
    product,
}: {
    product?: {
        id: string
        name: string
        description: string | null
        url: string
    }
}) {
    const { toast } = useToast()
    const form = useForm<ProductDetails>({
        resolver: zodResolver(productDetailsSchema),
        defaultValues: product
            ? { ...product, description: product.description ?? '' }
            : {
                  name: '',
                  url: '',
                  description: '',
              },
    })

    const isLoading = form.formState.isSubmitting || form.formState.isLoading

    const onSubmit: SubmitHandler<ProductDetails> = async (values) => {
        const data = await createProductAction(values)

        if (data?.message) {
            toast({
                title: data.error ? 'Error' : 'Success',
                description: data.message,
                variant: data.error ? 'destructive' : 'default',
            })
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='flex gap-6 flex-col'>
                <div className='grid gap-6 grid-cols-1 lg:grid-cols-2'>
                    <FormField
                        control={form.control}
                        name='name'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Product Name
                                    <RequiredLabelIcon />
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='url'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Enter your website URL
                                    <RequiredLabelIcon />
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                    Include the protocol (http/https) and the full path to the sales page
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name='description'
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    className='min-h-20 resize-none'
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                An optional description to help distinguish your product from other products
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className='self-end'>
                    <Button
                        disabled={isLoading}
                        type='submit'>
                        Save
                    </Button>
                </div>
            </form>
        </Form>
    )
}
