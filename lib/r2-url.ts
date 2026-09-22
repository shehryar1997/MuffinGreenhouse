// Public host for files in the Cloudflare R2 bucket. Kept apart from lib/r2.ts (which loads the AWS SDK) so
// browser code can build image URLs without bundling the SDK.
export const PUBLIC_BASE_URL = "https://images.muffinplants.com"
