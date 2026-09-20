import { ProductForm } from "../product-form"
import { getFormLookups, createProduct } from "../actions"
import { PageHeader } from "../../_components/ui"

export default async function NewProductPage() {
  const lookups = await getFormLookups()
  return (
    <div>
      <PageHeader title="Add product" back={{ href: "/admin/products", label: "Products" }} />
      <ProductForm lookups={lookups} action={createProduct} />
    </div>
  )
}
