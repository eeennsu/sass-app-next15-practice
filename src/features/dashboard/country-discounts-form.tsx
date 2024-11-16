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
import { ProductCountryDiscount, productCountryDiscountsSchema } from '@/lib/schemas/product'

interface Props {
    productId: Product['id']
    countryGroups: Awaited<ReturnType<typeof getProductCountryGroups>>
}

export const CountryDiscountsForm: FC<Props> = ({ countryGroups, productId }) => {
    const { toast } = useToast()
    const form = useForm<ProductCountryDiscount>({
        resolver: zodResolver(productCountryDiscountsSchema),
        defaultValues: {
            groups: countryGroups.map((group) => {
                const discount = group.discount?.discountPercentage ?? group.recommendedDiscountPercentage

                return {
                    countryGroupId: group.id,
                    coupon: group.discount?.coupon ?? '',
                    discountPercentage: discount != null ? discount * 100 : undefined,
                }
            }),
        },
    })

    const onSubmit: SubmitHandler<ProductCountryDiscount> = async (values) => {
        // const data = await updateCountryDiscounts(productId, values)
        // if (data.message) {
        //     toast({
        //         title: data.error ? 'Error' : 'Success',
        //         description: data.message,
        //         variant: data.error ? 'destructive' : 'defa ult',
        //     })
        // }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='flex gap-6 flex-col'>
                {countryGroups.map((group, index) => (
                    <Card key={group.id}>
                        <CardContent className='pt-6 flex gap-16 items-center'>
                            <div>
                                <h2 className='text-muted-foreground text-sm font-semibold mb-2'>{group.name}</h2>
                                <div className='flex gap-2 flex-wrap'>
                                    {group.countries.map((country) => (
                                        <Image
                                            key={country.code}
                                            width={24}
                                            height={16}
                                            alt={country.name}
                                            title={country.name}
                                            src={`http://purecatamphetamine.github.io/country-flag-icons/3x2/${country.code.toUpperCase()}.svg`}
                                            className='border'
                                        />
                                    ))}
                                </div>
                            </div>
                            <Input
                                type='hidden'
                                {...form.register(`groups.${index}.countryGroupId`)}
                            />
                            <div className='ml-auto flex-shrink-0 flex gap-2 flex-col w-min'>
                                <div className='flex gap-4'>
                                    <FormField
                                        control={form.control}
                                        name={`groups.${index}.discountPercentage`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Discount %</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className='w-24'
                                                        {...field}
                                                        type='number'
                                                        value={field.value ?? ''}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                                        name={`groups.${index}.coupon`}
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
                                <FormMessage>{form.formState.errors.groups?.[index]?.root?.message}</FormMessage>
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
