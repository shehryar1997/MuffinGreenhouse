// ============================================================================
// CLOUDFLARE R2 IMAGE HOSTING CONFIGURATION
// ============================================================================

// Environment variables needed:
// R2_ACCOUNT_ID=your-cloudflare-account-id
// R2_ACCESS_KEY_ID=your-access-key
// R2_SECRET_ACCESS_KEY=your-secret-key
// R2_BUCKET_NAME=muffin-images
// NEXT_PUBLIC_R2_PUBLIC_URL=https://images.muffin.pk (or your custom domain)

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'muffin-images'
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!

// R2 uses S3-compatible API
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
})

// ============================================================================
// UPLOAD IMAGE TO R2
// ============================================================================
export interface UploadImageResult {
  success: boolean
  key: string
  url: string
  thumbnailUrl?: string
  mediumUrl?: string
  largeUrl?: string
}

export async function uploadProductImage(
  file: Buffer | ArrayBuffer,
  productSku: string,
  filename: string,
  contentType: string = 'image/jpeg'
): Promise<UploadImageResult> {
  // R2 key structure: products/{sku}/{filename}
  const key = `products/${productSku.toLowerCase()}/${filename}`
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: file instanceof ArrayBuffer ? Buffer.from(file) : file,
    ContentType: contentType,
    // Enable public read access
    ACL: 'public-read',
  })

  await r2Client.send(command)

  // Generate URLs for different sizes
  const baseUrl = `${R2_PUBLIC_URL}/${key}`
  
  return {
    success: true,
    key,
    url: baseUrl,
    // You can create these variants with Cloudflare Images or Image Resizing
    thumbnailUrl: `${baseUrl}?width=150&height=150`,
    mediumUrl: `${baseUrl}?width=400`,
    largeUrl: `${baseUrl}?width=800`,
  }
}

// ============================================================================
// DELETE IMAGE FROM R2
// ============================================================================
export async function deleteProductImage(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  })

  await r2Client.send(command)
}

// ============================================================================
// URL HELPERS
// ============================================================================
export function getImageUrl(key: string, size: 'thumbnail' | 'small' | 'medium' | 'large' | 'original' = 'original'): string {
  if (size === 'original') {
    return `${R2_PUBLIC_URL}/${key}`
  }
  
  // Cloudflare Images/Resizing parameters
  const params: Record<string, string> = {
    thumbnail: 'width=150&height=150&fit=cover',
    small: 'width=300',
    medium: 'width=600',
    large: 'width=1200',
  }
  
  return `${R2_PUBLIC_URL}/${key}?${params[size]}`
}

// ============================================================================
// NEXT.JS API ROUTE FOR IMAGE UPLOAD
// ============================================================================
// Create: app/api/upload-image/route.ts

/**
 * import { NextResponse } from 'next/server'
 * import { uploadProductImage } from '@/supabase/config/r2-config'
 * 
 * export async function POST(request: Request) {
 *   const formData = await request.formData()
 *   const file = formData.get('file') as File
 *   const sku = formData.get('sku') as string
 *   
 *   if (!file || !sku) {
 *     return NextResponse.json({ error: 'Missing file or SKU' }, { status: 400 })
 *   }
 *   
 *   const arrayBuffer = await file.arrayBuffer()
 *   const result = await uploadProductImage(
 *     arrayBuffer,
 *     sku,
 *     file.name,
 *     file.type
 *   )
 *   
 *   return NextResponse.json(result)
 * }
 */
