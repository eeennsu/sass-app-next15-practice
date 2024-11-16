import { z } from 'zod'
import { removeTrailingSlash } from '../utils/string'

export const productDetailsSchema = z.object({
    name: z.string().min(1, 'required'),
    url: z.string().min(1, 'required').url('Invalid URL').transform(removeTrailingSlash),
    description: z.string().optional(),
})

export type ProductDetails = z.infer<typeof productDetailsSchema>

export const productCountryDiscountsSchema = z.object({
    groups: z.array(
        z.object({
            countryGroupId: z.string().min(1, 'Required'),
            discountPercentage: z
                .number()
                .max(100)
                .min(1)
                .or(z.nan())
                .transform((v) => (isNaN(v) ? undefined : v))
                .optional(),
            coupon: z.string().optional(),
        })
    ),
})

export type ProductCountryDiscount = z.infer<typeof productCountryDiscountsSchema>
