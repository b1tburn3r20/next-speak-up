// app/api/congress/route.ts
import { congressService } from '@/lib/services/congress'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const members = await congressService.getAllMembers()
  return NextResponse.json(members)
}