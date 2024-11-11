import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/components/tabs'
import { getProduct } from '@/server/queries/product'
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
            <Tabs defaultValue={tab}>
                <TabsList className='bg-background/60'>
                    <TabsTrigger value='details'>Details</TabsTrigger>
                    <TabsTrigger value='countries'>Country</TabsTrigger>
                    <TabsTrigger value='customization'>Customization</TabsTrigger>
                </TabsList>
                <TabsContent value='details'>{/* <DetailsTab product={product} /> */}</TabsContent>
                <TabsContent value='countries'>
                    {/* <CountryTab productId={productId} userId={userId} /> */}
                </TabsContent>
                <TabsContent value='customization'>
                    {/* <CustomizationsTab productId={productId} userId={userId} /> */}
                </TabsContent>
            </Tabs>
        </PageWithBackButton>
    )
}

export default EditProductPage
