import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const defaultCategories = [
    { name: "Ăn uống", icon: "🍜", type: "expense" },
    { name: "Đi lại", icon: "🚗", type: "expense" },
    { name: "Giải trí", icon: "🎮", type: "expense" },
    { name: "Mua sắm", icon: "🛍️", type: "expense" },
    { name: "Thu nhập", icon: "💰", type: "income" },
    { name: "Khác", icon: "📦", type: "expense" },
  ];

  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: {
        name: cat.name,
        type: cat.type,
        userId: null, // vẫn giữ để lọc riêng default
      },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          ...cat,
          userId: null,
        },
      });
      console.log(`✅ Tạo danh mục mới: ${cat.name}`);
    } else {
      console.log(`⚪ Bỏ qua, đã tồn tại: ${cat.name}`);
    }
  }

  console.log("🎉 Hoàn tất seed danh mục mặc định!");
}

main()
  .catch((err) => {
    console.error("❌ Lỗi khi seed danh mục:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });