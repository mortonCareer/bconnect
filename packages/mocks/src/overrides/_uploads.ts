/**
 * presigned PUT 으로 올라온 파일 바이트 보관소.
 *
 * 실 S3 대역인 `/mock-s3/{id}` PUT 은 원래 바이트를 버렸는데, 채팅 사진(#1150)은 올린 그림이
 * 그대로 말풍선에 보여야 확인이 된다. 여기서 blob URL 로 붙잡아 두고 소켓 mock 이 첨부 URL 로 쓴다.
 * 모듈 메모리라 하드 리로드 시 초기화된다.
 */
export interface MockUpload {
  url: string
  contentType: string
  size: number
}

const uploads = new Map<number, MockUpload>()

export async function rememberUpload(id: number, request: Request): Promise<void> {
  const blob = await request.blob()
  uploads.set(id, {
    url: URL.createObjectURL(blob),
    contentType: blob.type || 'application/octet-stream',
    size: blob.size,
  })
}

export function uploadedFile(id: number): MockUpload | undefined {
  return uploads.get(id)
}
