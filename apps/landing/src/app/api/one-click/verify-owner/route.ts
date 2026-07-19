import { NextResponse } from 'next/server'
import { fetchOwnerVerification } from '@bconnect/business/fetch-business'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { registrationNumber, ownerName, openDate } = body

    if (!registrationNumber || !ownerName || !openDate) {
      return NextResponse.json(
        { valid: false, message: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    const result = await fetchOwnerVerification(registrationNumber, ownerName, openDate)

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ valid: false, message: '진위확인에 실패했습니다.' }, { status: 500 })
  }
}
