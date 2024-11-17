'use client'

import { Product } from '@/drizzle/types/table-types'
import { getProductCountryGroups } from '@/server/services/product-service'
import type { FC } from 'react'
import { Card, CardContent } from '@/lib/components/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/lib/components/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import Image from 'next/image'
import { Input } from '@/lib/components/input'
import { Button } from '@/lib/components/button'
import { useToast } from '@/hooks/use-toast'
import { ProductCountryDiscountForm, productCountryDiscountsFormSchema } from '@/lib/schemas/product-form'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/lib/components/tooltip'
import { updateCountryDiscountsAction } from '@/server/actions/product-action'
import { useRouter } from 'next/navigation'

type CountryGroups = Awaited<ReturnType<typeof getProductCountryGroups>>
interface Props {
    productId: Product['id']
    countryGroups: CountryGroups
}

export const CountryDiscountsForm: FC<Props> = ({ countryGroups, productId }) => {
    const { refresh } = useRouter()
    const { toast } = useToast()
    const form = useForm<ProductCountryDiscountForm>({
        resolver: zodResolver(productCountryDiscountsFormSchema),
        defaultValues: {
            groups: countryGroups.map((group) => {
                const discount =
                    group.discount?.discountPercentage ??
                    (group?.recommendedDiscountPercentage && group.recommendedDiscountPercentage * 100)

                return {
                    countryGroupId: group.id,
                    coupon: group.discount?.coupon ?? '',
                    discountPercentage: discount ?? undefined,
                }
            }),
        },
    })

    const onSubmit: SubmitHandler<ProductCountryDiscountForm> = async (values) => {
        const data = await updateCountryDiscountsAction({ productId, unSafeCountryDiscountsForm: values })
        if (data?.message) {
            toast({
                title: data.error ? 'Error' : 'Success',
                description: data.message,
                variant: data.error ? 'destructive' : 'default',
            })
        }

        if (!data?.error) {
            refresh()

            window.scrollTo({ top: 0, behavior: 'instant' })
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='flex gap-6 flex-col'>
                {countryGroups.map((group, i) => (
                    <Card key={group.id}>
                        <CardContent className='pt-6 flex gap-16 items-center'>
                            <div>
                                <h2 className='text-muted-foreground text-sm font-semibold mb-2'>{group.name}</h2>
                                <div className='flex gap-2 flex-wrap'>
                                    {group.countries.map((country) => (
                                        <CountryFlagWithTooltip
                                            key={country.code}
                                            {...country}
                                        />
                                    ))}
                                </div>
                            </div>
                            <Input
                                type='hidden'
                                {...form.register(`groups.${i}.countryGroupId`)}
                            />
                            <div className='ml-auto flex-shrink-0 flex gap-2 flex-col w-min'>
                                <div className='flex gap-4'>
                                    <FormField
                                        control={form.control}
                                        name={`groups.${i}.discountPercentage`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Discount %</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className='w-24'
                                                        {...field}
                                                        type='number'
                                                        value={field.value ?? ''}
                                                        onChange={(e) => {
                                                            field.onChange(
                                                                e.target.value === '' ? '' : e.target.valueAsNumber
                                                            )
                                                        }}
                                                        min='0'
                                                        max='100'
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`groups.${i}.coupon`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Coupon</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className='w-48'
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormMessage>{form.formState.errors.groups?.[i]?.root?.message}</FormMessage>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <div className='self-end'>
                    <Button
                        disabled={form.formState.isSubmitting}
                        type='submit'>
                        Save
                    </Button>
                </div>
            </form>
        </Form>
    )
}

const CountryFlagWithTooltip: FC<CountryGroups[number]['countries'][number]> = ({ code, name }) => {
    return (
        <TooltipProvider
            key={code}
            delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Image
                        src={`/flags/3x2/${code.toUpperCase()}.svg`}
                        width={24}
                        height={16}
                        alt={name}
                        title={name}
                        className='border'
                    />
                </TooltipTrigger>
                <TooltipContent>
                    <p>{name}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
