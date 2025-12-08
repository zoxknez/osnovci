import Link from "next/link";
import { cn } from "@/lib/utils";
import { navigation } from "./navigation-config";

interface SidebarNavItemsProps {
  pathname: string;
  onItemClick?: () => void;
  variant?: "mobile" | "desktop";
}

export function SidebarNavItems({
  pathname,
  onItemClick,
  variant = "desktop",
}: SidebarNavItemsProps) {
  return (
    <ul className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <li key={item.name}>
            <Link
              href={item.href}
              {...(onItemClick && { onClick: onItemClick })}
              className={cn(
                "group flex items-center gap-x-3 rounded-xl px-4 transition-all",
                variant === "mobile"
                  ? "py-4 text-base font-medium"
                  : "py-3 text-sm font-medium",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-gray-100 active:scale-95",
              )}
            >
              <span className={variant === "mobile" ? "text-3xl" : "text-2xl"}>
                {item.emoji}
              </span>
              <span>{item.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
