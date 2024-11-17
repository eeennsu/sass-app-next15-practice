'use client'

import { ProductCustomization } from '@/drizzle/types/table-types'
import { useToast } from '@/hooks/use-toast'
import {
    ProductCustomizationForm as ProductCustomizationFormType,
    productCustomizationSchema,
} from '@/lib/schemas/product-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { FC } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { Banner } from './banner'
import { NoPermissionCard } from './no-permission-card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/lib/components/form'
import { RequiredLabelIcon } from '@/shared/icons/required-label'
import { Textarea } from '@/lib/components/textarea'
import { Input } from '@/lib/components/input'
import { Switch } from '@/lib/components/switch'
import { Button } from '@/lib/components/button'
import { updateProductCustomizationAction } from '@/server/actions/product-action'

export function ProductCustomizationForm({
    customizationProduct,
    canCustomizeBanner,
    canRemoveBranding,
}: {
    customizationProduct: ProductCustomization
    canRemoveBranding: boolean
    canCustomizeBanner: boolean
}) {
    const { toast } = useToast()
    const form = useForm<ProductCustomizationFormType>({
        resolver: zodResolver(productCustomizationSchema),
        defaultValues: {
            ...customizationProduct,
            classPrefix: customizationProduct.classPrefix ?? '',
        },
    })

    const onSubmit: SubmitHandler<ProductCustomizationFormType> = async (values) => {
        const data = await updateProductCustomizationAction({
            productId: customizationProduct.productId,
            unsafeProductCustomization: values,
        })
        if (data?.message) {
            toast({
                title: data.error ? 'Error' : 'Success',
                description: data.message,
                variant: data.error ? 'destructive' : 'default',
            })
        }
    }

    const formValues = form.watch()

    return (
        <>
            <div>
                <Banner
                    message={formValues.locationMessage}
                    mappings={{
                        country: 'India',
                        coupon: 'HALF-OFF',
                        discount: '50',
                    }}
                    customization={formValues}
                    canRemoveBranding={canRemoveBranding}
                />
            </div>
            {!canCustomizeBanner && <NoPermissionCard className='mt-8' />}
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className='flex gap-6 flex-col mt-8'>
                    <div className='grid gap-8 grid-cols-1 md:grid-cols-2'>
                        <FormField
                            control={form.control}
                            name='locationMessage'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        PPP Discount Message
                                        <RequiredLabelIcon />
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            disabled={!canCustomizeBanner}
                                            className='min-h-20 resize-none'
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {'Data Parameters: {country}, {coupon}, {discount}'}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <FormField
                                control={form.control}
                                name='backgroundColor'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Background color
                                            <RequiredLabelIcon />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={!canCustomizeBanner}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='textColor'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Text color
                                            <RequiredLabelIcon />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={!canCustomizeBanner}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='fontSize'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Font size
                                            <RequiredLabelIcon />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={!canCustomizeBanner}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='isSticky'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sticky?</FormLabel>
                                        <FormControl>
                                            <Switch
                                                className='block'
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={!canCustomizeBanner}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='bannerContainer'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Banner container
                                            <RequiredLabelIcon />
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={!canCustomizeBanner}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            HTML container selector where you want to place the banner. Ex: #container,
                                            .container, body
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='classPrefix'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CSS Prefix</FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={!canCustomizeBanner}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            An optional prefix added to all CSS classes to avoid conflicts
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    {canCustomizeBanner && (
                        <div className='self-end'>
                            <Button
                                disabled={form.formState.isSubmitting}
                                type='submit'>
                                Save
                            </Button>
                        </div>
                    )}
                </form>
            </Form>
        </>
    )
}
