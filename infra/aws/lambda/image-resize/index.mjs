import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const s3 = new S3Client()

const VARIANTS = [
  { size: 'm', px: 800, quality: 80 },
  { size: 's', px: 400, quality: 50 },
]

const ORIGINAL_MARKER = '/images/o/'

export const handler = async (event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))

    if (!key.includes(ORIGINAL_MARKER)) {
      console.log(`skip: ${key}`)
      continue
    }

    const [scope, filename] = key.split(ORIGINAL_MARKER)
    const uuid = filename.slice(0, filename.lastIndexOf('.'))

    try {
      const original = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      const body = await original.Body.transformToByteArray()

      await Promise.all(
        VARIANTS.map(async ({ size, px, quality }) => {
          const resized = await sharp(body)
            .rotate()
            .resize(px, px, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality })
            .toBuffer()

          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: `${scope}/images/${size}/${uuid}.webp`,
              Body: resized,
              ContentType: 'image/webp',
              CacheControl: 'public, max-age=31536000, immutable',
            })
          )
        })
      )
      console.log(`resized: ${key}`)
    } catch (error) {
      console.log(error)
    }
  }
}
