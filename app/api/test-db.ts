import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET() {
  try {
    const data = await prisma.group.findMany({ take: 1 })
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    console.error("DB test error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
