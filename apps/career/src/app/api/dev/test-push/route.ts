import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextResponse } from 'next/server'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface DevPushBody {
  token: string
  title: string
  body: string
  referenceType?: string
  referenceId?: string
}

function ensureAdminApp() {
  if (getApps().length > 0) return
  const serviceAccount = JSON.parse(
    readFileSync(join(process.cwd(), '.secrets/firebase-admin.json'), 'utf8')
  ) as Record<string, string>
  initializeApp({ credential: cert(serviceAccount) })
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 })
  }

  const { token, title, body, referenceType, referenceId } = (await request.json()) as DevPushBody
  if (!token) {
    return NextResponse.json({ error: 'token 이 필요합니다' }, { status: 400 })
  }

  try {
    ensureAdminApp()
    // BE(SnsPushSender)와 같은 data 계약 — reference_type 은 소문자.
    const id = await getMessaging().send({
      token,
      data: {
        title,
        body,
        reference_type: referenceType?.toLowerCase() ?? '',
        reference_id: referenceId ?? '',
      },
    })
    return NextResponse.json({ id })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
