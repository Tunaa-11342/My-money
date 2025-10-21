import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";

function generateInviteCode(length = 6) {
  return randomBytes(length).toString("base64url").slice(0, length);
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, budget = 0, periodDays = 30, isPrivate = false } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Tên nhóm không được để trống" },
        { status: 400 }
      );
    }

<<<<<<< HEAD
    // 🧩 Đồng bộ user Clerk -> Prisma (tránh lỗi khóa ngoại)
    const clerkEmail = user.emailAddresses[0]?.emailAddress;

    const existingUser = await prisma.user.findUnique({
      where: { email: clerkEmail },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: user.id,
          name: user.fullName,
          email: clerkEmail,
          imageUrl: user.imageUrl,
          password: "",
        },
      });
    } else {
      await prisma.user.update({
        where: { email: clerkEmail },
        data: {
          name: user.fullName,
          imageUrl: user.imageUrl,
        },
      });
    }
=======
// Đồng bộ user Clerk -> Prisma
    const clerkEmail = user.emailAddresses[0]?.emailAddress;
>>>>>>> 242a3a1 (Fix bugs: JoinGroup day 2)

    const existingUser = await prisma.user.findUnique({
      where: { email: clerkEmail },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: user.id,
          name: user.fullName,
          email: clerkEmail,
          imageUrl: user.imageUrl,
        },
      });
    } else {
      await prisma.user.update({
        where: { email: clerkEmail },
        data: {
          name: user.fullName,
          imageUrl: user.imageUrl,
        },
      });
    }
    // 🧩 Tạo nhóm mới, có inviteCode ngắn
    const group = await prisma.group.create({
      data: {
        name,
        budget,
        periodDays,
        isPrivate,
        ownerId: user.id,
        inviteCode: generateInviteCode(6),
        memberships: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
      include: {
        memberships: {
          include: { user: true },
        },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET giữ nguyên như cũ
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      include: { group: true },
    });

    const groups = memberships.map((m) => m.group);
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
