"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  ResponsiveContainer,
} from "recharts";

interface GroupReportProps {
  expenses: {
    id: string;
    name: string;
    amount: number;
    categoryName: string;
    createdBy: string;
  }[];
  memberships: {
    userId: string;
    user: { name: string | null } | null;
  }[];
  categoryLabels?: Record<string, string>;
}

export default function GroupReport({
  expenses,
  memberships,
  categoryLabels,
}: GroupReportProps) {
  if (expenses.length === 0)
    return (
      <p className="text-muted-foreground italic">
        Chưa có dữ liệu chi tiêu để hiển thị báo cáo.
      </p>
    );

  // Gom tổng theo danh mục
  const expenseByCategory: Record<string, number> = {};
  for (const e of expenses) {
    const cat = e.categoryName || "Khác";
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + e.amount;
  }

  const categoryData = Object.entries(expenseByCategory).map(
    ([name, value]) => ({
      name: categoryLabels?.[name] ?? name,
      value,
    })
  );

  // Gom tổng theo người chi
  const expenseByMember: Record<string, number> = {};
  for (const e of expenses) {
    const payer =
      memberships.find((m) => m.userId === e.createdBy)?.user?.name ??
      "Ẩn danh";
    expenseByMember[payer] = (expenseByMember[payer] || 0) + e.amount;
  }
  const memberData = Object.entries(expenseByMember).map(([name, value]) => ({
    name,
    value,
  }));

  const gradients = [
    { id: "grad1", from: "#6366F1", to: "#8B5CF6" },
    { id: "grad2", from: "#34D399", to: "#10B981" },
    { id: "grad3", from: "#F472B6", to: "#EC4899" },
    { id: "grad4", from: "#F59E0B", to: "#D97706" },
    { id: "grad5", from: "#60A5FA", to: "#3B82F6" },
  ];

  return (
    <div className="relative p-4 rounded-xl border border-border shadow-lg transition-all duration-500
  bg-gradient-to-br from-indigo-50 to-purple-50
  dark:from-[#0f0f1f]/80 dark:to-[#1a1a2a]/80">
      <div className="grid sm:grid-cols-2 gap-8 w-full max-w-6xl mx-auto transition-colors duration-500">
       
        <div className="relative p-4 rounded-xl border border-border shadow-lg transition-all duration-500
    bg-gradient-to-br from-indigo-50 to-purple-50
    dark:from-indigo-950/60 dark:to-purple-950/60">
          <h3 className="text-lg font-semibold mb-4 text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Phân loại theo danh mục
          </h3>
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <defs>
                {gradients.map((g) => (
                  <linearGradient
                    key={g.id}
                    id={g.id}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={g.from} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={g.to} stopOpacity={0.8} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                outerRadius="80%"
                paddingAngle={3}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={2}
                animationBegin={200}
                animationDuration={1000}
              >
                {categoryData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#grad${(index % gradients.length) + 1})`}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(17,17,27,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 blur-xl opacity-40" />
        </div>

        <div className="relative p-4 rounded-xl border border-border shadow-lg transition-all duration-500
    bg-gradient-to-br from-emerald-50 to-lime-50
    dark:from-emerald-950/60 dark:to-lime-950/60">
          <h3 className="text-lg font-semibold mb-4 text-center bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
            Chi tiêu theo thành viên
          </h3>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              data={memberData}
              margin={{ top: 10, right: 30, left: 40, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip
                contentStyle={{
                  background: "rgba(17,17,27,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {memberData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={`url(#grad${(i % gradients.length) + 1})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-br from-emerald-500/5 to-lime-500/5 blur-xl opacity-40" />
        </div>
      </div>
    </div>
  );
}
