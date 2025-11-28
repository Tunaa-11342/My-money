"use client";

import * as React from "react";
import Link from "next/link";
import type { MainNavItem } from "@/types";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Icons } from "@/components/app-ui/icons";
import { Wallet } from "lucide-react";
import { Bell, X } from "lucide-react";
import { useState , useEffect} from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface MainNavProps {
  items?: MainNavItem[];
}

export function MainNav({ items }: MainNavProps) {
  return (
    <div className="hidden gap-6 lg:flex">
      <Link href="/" className="hidden items-center space-x-2 lg:flex">
        <Wallet
          className="size-10 stroke stroke-indigo-600 stroke-[1.4]"
          aria-hidden="true"
        />
        <span className="hidden lg:inline-block bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-2xl font-bold leading-tight tracking-tighter text-transparent">
          {siteConfig.name}
        </span>
        <span className="sr-only">Trang chủ</span>
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          {items
            ?.filter((item) => item.title !== items[0]?.title)
            .map((item) =>
              item?.items ? (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuTrigger className="h-auto capitalize">
                    {item.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {item.items.map((item) => (
                        <ListItem
                          key={item.title}
                          title={item.title}
                          href={item.href}
                        >
                          {item.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                item.href && (
                  <NavigationMenuItem key={item.title}>
                    <Link href={item.href} legacyBehavior passHref>
                      <NavigationMenuLink
                        className={cn(navigationMenuTriggerStyle(), "h-auto")}
                      >
                        {item.title}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )
              )
            )}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={String(href)}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export function NotificationBell({
  notifications,
  markAllAsRead,
}: {
  notifications: any[]
  markAllAsRead: () => void
}) {
  const [data, setData] = useState<any[]>(notifications)

  useEffect(() => {
    setData(notifications)
  }, [notifications])

  const unreadCount = data.filter(n => !n.read).length

  const deleteNotification = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id }),
    })
    setData(prev => prev.filter(n => n.id !== id))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72" forceMount>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Thông báo</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => {
                markAllAsRead()
                setData(prev => prev.map(n => ({ ...n, read: true })))
              }}
              className="text-xs text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors"
            >
              Đánh dấu đã đọc
            </button>
          )}
        </div>

        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có thông báo nào</p>
        ) : (
          <ul className="max-h-64 overflow-y-auto scrollbar-none">
            {data.map(n => (
              <li
                key={n.id}
                className={`py-1 border-b last:border-none flex justify-between items-start ${
                  n.read ? 'opacity-70' : ''
                }`}
              >
                <div>
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteNotification(n.id)}
                  className="ml-2 text-muted-foreground hover:text-red-500"
                  title="Xóa thông báo"
                >
                  <X className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}