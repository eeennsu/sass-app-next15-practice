interface Props {
    params: Promise<{ productId: string }>
    searchParams: Promise<{ tab?: string }>
}

const EditProductPage = async ({ params, searchParams }: Props) => {
    const { productId } = await params
    const { tab } = await searchParams

    return <main></main>
}

export default EditProductPage
