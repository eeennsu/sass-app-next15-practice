import { z } from 'zod'
import { removeTrailingSlash } from '../utils/string'

export const productDetailsSchema = z.object({
    name: z.string().min(1, 'required'),
    url: z.string().min(1, 'required').url('Invalid URL').transform(removeTrailingSlash),
    description: z.string().optional(),
})

export type ProductDetails = z.infer<typeof productDetailsSchema>
