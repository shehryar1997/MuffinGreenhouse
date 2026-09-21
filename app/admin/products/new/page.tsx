import { ProductForm } from "../product-form"
import { ProductCsvImport } from "../product-csv-import"
import { getFormLookups, createProduct } from "../actions"
import { PageHeader } from "../../_components/ui"

// A CSV import makes several server-action calls (a few rows each); give each room to finish.
export const maxDuration = 60

export default async function NewProductPage() {
  const lookups = await getFormLookups()
  return (
    <div>
      <PageHeader title="Add product" back={{ href: "/admin/products", label: "Products" }} actions={<ProductCsvImport />} />
      <ProductForm lookups={lookups} action={createProduct} />
    </div>
  )
}
