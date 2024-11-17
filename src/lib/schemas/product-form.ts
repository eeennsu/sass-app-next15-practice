import { z } from 'zod'
import { removeTrailingSlash } from '../utils/string'

export const productDetailsSchema = z.object({
    name: z.string().min(1, 'required'),
    url: z.string().min(1, 'required').url('Invalid URL').transform(removeTrailingSlash),
    description: z.string().optional(),
})

export const productCountryDiscountsFormSchema = z.object({
    groups: z.array(
        z
            .object({
                countryGroupId: z.string().min(1, 'Required'),
                discountPercentage: z
                    .union([z.number().min(0).max(100), z.literal('')])
                    .transform((v) => (v === '' ? undefined : v))
                    .optional(),
                coupon: z.string().optional(),
            })
            .refine(
                (value) => {
                    const hasCoupon = value.coupon != null && value.coupon.length > 0
                    const hasDiscount = value.discountPercentage != null
                    return !(hasCoupon && !hasDiscount)
                },
                {
                    message: 'A discount is required if a coupon code is provided',
                    path: ['discountPercentage'],
                }
            )
    ),
})

export const productCustomizationSchema = z.object({
    classPrefix: z.string().optional(),
    backgroundColor: z.string().min(1, 'Required'),
    textColor: z.string().min(1, 'Required'),
    fontSize: z.string().min(1, 'Required'),
    locationMessage: z.string().min(1, 'Required'),
    bannerContainer: z.string().min(1, 'Required'),
    isSticky: z.boolean(),
})

export type ProductDetails = z.infer<typeof productDetailsSchema>
export type ProductCountryDiscountForm = z.infer<typeof productCountryDiscountsFormSchema>
export type ProductCustomizationForm = z.infer<typeof productCustomizationSchema>
