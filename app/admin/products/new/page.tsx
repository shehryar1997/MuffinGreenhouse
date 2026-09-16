import { ProductForm } from "../product-form"
import { getFormLookups, createProduct } from "../actions"

export default async function NewProductPage() {
  const lookups = await getFormLookups()
  return (
    <div>
      <h1 className="text-2xl font-serif mb-6">Add Product</h1>
      <ProductForm lookups={lookups} action={createProduct} />
    </div>
  )
}
