import { NextResponse } from 'next/server'
import { importUploadedFiles } from '@/lib/server/import-files'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const collectionIdValue = formData.get('collectionId')
    const collectionId = typeof collectionIdValue === 'string' ? collectionIdValue : null
    const files = formData.getAll('files').filter((value): value is File => value instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const result = await importUploadedFiles(files, collectionId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    const status = message === 'Unauthorized' ? 401 : 500

    return NextResponse.json({ error: message }, { status })
  }
}
