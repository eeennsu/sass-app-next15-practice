import { Product } from '@/drizzle/types/table-types'
import { CountryDiscountsForm } from '@/features/dashboard/country-discounts-form'
import { ProductCustomizationForm } from '@/features/dashboard/product-customization-form'
import { ProductDetailsForm } from '@/features/dashboard/product-details-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/lib/components/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/components/tabs'
import { canCustomizeBanner, canRemoveBranding } from '@/server/services/permission-service'
import { getProduct, getProductCountryGroups, getProductCustomization } from '@/server/services/product-service'
import { PageWithBackButton } from '@/shared/common/page-with-back-button'
import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'

interface Props {
    params: Promise<{ productId: string }>
    searchParams: Promise<{ tab?: string }>
}

const EditProductPage = async ({ params, searchParams }: Props) => {
    const { userId, redirectToSignIn } = await auth()

    if (!userId) {
        return redirectToSignIn()
    }

    const [{ productId }, { tab }] = await Promise.all([params, searchParams])

    const product = await getProduct({ productId, userId })

    if (!product) return notFound()

    return (
        <PageWithBackButton
            backButtonHref='/dashboard/products'
            pageTitle='Edit Product'>
            <Tabs defaultValue={tab || 'details'}>
                <TabsList className='bg-background/60'>
                    <TabsTrigger value='details'>Details</TabsTrigger>
                    <TabsTrigger value='countries'>Country</TabsTrigger>
                    <TabsTrigger value='customization'>Customization</TabsTrigger>
                </TabsList>
                <TabsContent value='details'>
                    <DetailsTab product={product} />
                </TabsContent>
                <TabsContent value='countries'>
                    <CountryTab
                        productId={productId}
                        userId={userId}
                    />
                </TabsContent>
                <TabsContent value='customization'>
                    <CustomizationsTab
                        productId={productId}
                        userId={userId}
                    />
                </TabsContent>
            </Tabs>
        </PageWithBackButton>
    )
}

export default EditProductPage

function DetailsTab({ product }: { product: Product }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className='text-xl'>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
                <ProductDetailsForm initialProduct={product} />
            </CardContent>
        </Card>
    )
}

async function CountryTab({ productId, userId }: { productId: Product['id']; userId: string }) {
    const countryGroups = await getProductCountryGroups({
        productId,
        userId,
    })

    return (
        <Card>
            <CardHeader>
                <CardTitle className='text-xl'>Country Discounts</CardTitle>
                <CardDescription>
                    Leave the discount field blank if you do not want to display deals for any specific parity group.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <CountryDiscountsForm
                    productId={productId}
                    countryGroups={countryGroups}
                />
            </CardContent>
        </Card>
    )
}

async function CustomizationsTab({ productId, userId }: { productId: Product['id']; userId: string }) {
    const customizationProduct = await getProductCustomization({ productId, userId })

    if (!customizationProduct) return notFound()

    const canCustomize = await canCustomizeBanner({ userId })
    const canRemove = await canRemoveBranding({ userId })

    return (
        <Card>
            <CardHeader>
                <CardTitle className='text-xl'>Banner Customization</CardTitle>
            </CardHeader>
            <CardContent>
                <ProductCustomizationForm
                    canCustomizeBanner={canCustomize}
                    canRemoveBranding={canRemove}
                    customizationProduct={customizationProduct}
                />
            </CardContent>
        </Card>
    )
}
