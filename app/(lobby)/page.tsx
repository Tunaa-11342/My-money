import { Icons } from "@/components/app-ui/icons";
import { Shell } from "@/components/app-ui/shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import * as React from "react";
import { Wallet } from "lucide-react";

export default function IndexPage() {
  return (
    <React.Suspense fallback={<h1>Đang tải...</h1>}>
      <Shell className="max-w-7xl">
        <section className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-6 py-24 text-center md:py-32">
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-[120px]" />
          </div>

          <div
            className="animate-fade-up flex flex-col items-center space-y-3"
            style={{ animationDelay: "0.1s", animationFillMode: "both" }}
          >
            <Wallet className="h-14 w-14 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm text-muted-foreground font-medium tracking-wide">
              Ứng dụng quản lý chi tiêu thông minh
            </span>
          </div>

          <h1
            className="animate-fade-up bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight"
            style={{ animationDelay: "0.2s", animationFillMode: "both" }}
          >
            Quản lý chi tiêu cá nhân & nhóm
          </h1>

          <p
            className="max-w-2xl animate-fade-up text-balance text-lg text-muted-foreground sm:text-xl sm:leading-8"
            style={{ animationDelay: "0.3s", animationFillMode: "both" }}
          >
            Theo dõi thu chi, đặt ngân sách, chia sẻ tài chính cùng bạn bè.
            <br /> Tất cả chỉ trong một ứng dụng trực quan, nhanh chóng và bảo
            mật.
          </p>

          <div
            className="animate-fade-up flex flex-wrap items-center justify-center gap-4 mt-4"
            style={{ animationDelay: "0.4s", animationFillMode: "both" }}
          >
            {/* <Button asChild size="lg" className="px-6 py-5 text-base">
              <Link href="/wizard">
                Bắt đầu ngay
                <span className="sr-only">go to wizard</span>
              </Link>
            </Button> */}

            <Button
              asChild
              variant="outline"
              size="lg"
              className="px-6 py-5 text-base border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            >
              <Link href="/dashboard">
                Bắt đầu ngay
                <span className="sr-only">go to dashboard</span>
              </Link>
            </Button>
          </div>

          <p
            className="animate-fade-up mt-8 text-sm text-muted-foreground"
            style={{ animationDelay: "0.5s", animationFillMode: "both" }}
          >
            💡 Gợi ý: Hãy tạo nhóm để cùng quản lý chi tiêu với bạn bè hoặc gia
            đình!
          </p>
        </section>
      </Shell>
    </React.Suspense>
  );
}
