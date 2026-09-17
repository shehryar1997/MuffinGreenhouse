import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { productIds }: { productIds: string[] } = await request.json()
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase
      .from('products')
      .select('id, box_height_cm, box_width_cm, box_breadth_cm')
      .in('id', productIds)

    if (error) {
      console.error('Error fetching product dimensions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch product dimensions' },
        { status: 500 }
      )
    }

    // Create a map of productId to dimensions
    const dimensionsMap: Record<string, {
      boxHeightCm: number | null
      boxWidthCm: number | null
      boxBreadthCm: number | null
    }> = {}

    data.forEach(product => {
      dimensionsMap[product.id] = {
        boxHeightCm: product.box_height_cm,
        boxWidthCm: product.box_width_cm,
        boxBreadthCm: product.box_breadth_cm,
      }
    })

    return NextResponse.json({ dimensions: dimensionsMap })
  } catch (error) {
    console.error('Unexpected error in product-dimensions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}