import { AttachmentType } from './generated/schemas/attachmentType'
import type { Post } from './generated/schemas/post'

export function postImageUrls(post: Pick<Post, 'attachments'>): string[] {
  return (post.attachments ?? [])
    .filter((attachment) => attachment.type === AttachmentType.IMAGE)
    .map((attachment) => attachment.url)
}
