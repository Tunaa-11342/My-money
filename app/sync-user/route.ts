import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await db.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!existing) {
      // Tạo record UserSettings mặc định
      await db.userSettings.create({
        data: {
          userId: user.id,
          currency: "VND",
        },
      });

      // Danh mục mặc định
      const defaultCategories = [
        { name: "Ăn uống", type: "expense", icon: "🍚" },
        { name: "Tiền điện", type: "expense", icon: "💡" },
        { name: "Tiền nước", type: "expense", icon: "🚿" },
        { name: "Dầu gội", type: "expense", icon: "🧴" },
        { name: "Tiền lương", type: "income", icon: "💵" },
        { name: "Tiền thưởng", type: "income", icon: "🎁" },
      ];

      await db.category.createMany({
        data: defaultCategories.map((c) => ({ ...c, userId: user.id })),
      });
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
