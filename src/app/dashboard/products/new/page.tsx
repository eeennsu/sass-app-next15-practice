import { ProductDetailsForm } from '@/features/dashboard/product-details-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/card'
import { canCreateProduct } from '@/server/services/permission-service';
import { HasPermission } from '@/shared/common/has-permission'
import { PageWithBackButton } from '@/shared/common/page-with-back-button'

export default function NewProductPage() {
    return (
        <PageWithBackButton
            pageTitle='Create Product'
            backButtonHref='/dashboard/products'>
            <HasPermission
                permission={canCreateProduct}
                renderFallback
                fallbackText='You have already created the maximum number of products. Try upgrading your account to create more.'>
                <Card>
                    <CardHeader>
                        <CardTitle className='text-xl'>Product Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ProductDetailsForm />
                    </CardContent>
                </Card>
            </HasPermission>
        </PageWithBackButton>
    )
}
