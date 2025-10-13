import { FooterItem, MainNavItem } from "@/types";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "My Money",
  description: "Ứng dụng quản lý chi tiêu cá nhân và nhóm hiệu quả.",
  url: "https://mymoney.local",
  ogImage: "/og-image.png",
  mainNav: [
    {
      title: "Lobby",
      items: [
        {
          title: "Products",
          href: "/products",
          description: "All the products we have to offer.",
          items: [],
        },
        {
          title: "Build a Board",
          href: "/build-a-board",
          description: "Build your own custom skateboard.",
          items: [],
        },
        {
          title: "Blog",
          href: "/blog",
          description: "Read our latest blog posts.",
          items: [],
        },
      ],
    },
    {
      title: "Tổng quan",
      href: "/dashboard",
      description: "Manage your account and orders.",
    },
    {
      title: "Giao dịch",
      href: "/transactions",
      description: "Manage your account and orders.",
    },
    {
      title: "Nhóm",
      href: "/group",
      description: "Manage your account and orders.",
    },
    {
      title: "Tùy chỉnh",
      href: "/manage",
      description: "Manage your account and orders.",
    },
  ] satisfies MainNavItem[],
  footerNav: [
    {
      title: "Credits",
      items: [
        {
          title: "OneStopShop",
          href: "https://onestopshop.jackblatch.com",
          external: true,
        },
        {
          title: "Acme Corp",
          href: "https://acme-corp.jumr.dev",
          external: true,
        },
        {
          title: "craft.mxkaske.dev",
          href: "https://craft.mxkaske.dev",
          external: true,
        },
        {
          title: "Taxonomy",
          href: "https://tx.shadcn.com/",
          external: true,
        },
        {
          title: "shadcn/ui",
          href: "https://ui.shadcn.com",
          external: true,
        },
      ],
    },
    {
      title: "Help",
      items: [
        {
          title: "About",
          href: "/about",
          external: false,
        },
        {
          title: "Contact",
          href: "/contact",
          external: false,
        },
        {
          title: "Terms",
          href: "/terms",
          external: false,
        },
        {
          title: "Privacy",
          href: "/privacy",
          external: false,
        },
      ],
    },
  ] satisfies FooterItem[],
};
