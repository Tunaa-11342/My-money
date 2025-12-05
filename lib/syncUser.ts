import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function syncCurrentUser() {
  const user = await currentUser();
  if (!user) return null;

  // 1. Sync User table
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ id: user.id }, { email: user.emailAddresses[0]?.emailAddress }],
    },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || "Người dùng",
        imageUrl: user.imageUrl || "",
      },
    });
  } else {
    // Nếu id không khớp thì update
    if (existingUser.id !== user.id) {
      await prisma.user.update({
        where: { email: existingUser.email },
        data: {
          id: user.id,
        },
      });
    }
  }

  // 2. Sync UserSettings
  let settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId: user.id,
        currency: "VND",
        monthlyBudget: 0,
      },
    });
  }

  // 3. Sync default categories
  const categoryCount = await prisma.category.count({
    where: { userId: user.id },
  });

  if (categoryCount === 0) {
    const defaultCategories = [
      { name: "Ăn uống", type: "expense", icon: "🍚" },
      { name: "Tiền điện", type: "expense", icon: "💡" },
      { name: "Tiền nước", type: "expense", icon: "🚿" },
      { name: "Dầu gội", type: "expense", icon: "🧴" },
      { name: "Tiền lương", type: "income", icon: "💵" },
      { name: "Tiền thưởng", type: "income", icon: "🎁" },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map((c) => ({
        ...c,
        userId: user.id,
      })),
    });
  }

  return user;
}
