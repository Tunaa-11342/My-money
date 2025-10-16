import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";


export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const memberships = await prisma.member.findMany({
      where: { userId: user.id },
      include: { group: true },
    });

    const groups = memberships.map((m) => m.group);
    return NextResponse.json(groups);
  } catch (error) {
    console.error("[GROUPS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Tạo nhóm mới
 */
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, isPrivate, maxMembers } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Tên nhóm không được để trống" },
        { status: 400 }
      );
    }

    const validMaxMembers =
      typeof maxMembers === "number" && maxMembers > 0 ? maxMembers : 5;

    const newGroup = await prisma.group.create({
      data: {
        id: randomUUID(),
        name: name.trim(),
        ownerId: user.id, 
        isPrivate: !!isPrivate,
        maxMembers: validMaxMembers,
        members: {
          create: {
            userId: user.id,
            role: "admin",
          },
        },
      },
      include: { members: true },
    });

    return NextResponse.json(newGroup);
  } catch (error) {
    console.error("[GROUPS_POST_ERROR]", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
