import {
  BarChart3,
  BookOpen,
  Bot,
  Calendar,
  Clock,
  Home,
  Users,
  Settings,
} from "lucide-react";

export const navigation = [
  { name: "Danas", href: "/dashboard", icon: Home, emoji: "🏠" },
  { name: "Domaći", href: "/dashboard/domaci", icon: BookOpen, emoji: "📚" },
  {
    name: "Raspored",
    href: "/dashboard/raspored",
    icon: Calendar,
    emoji: "📅",
  },
  { name: "Ocene", href: "/dashboard/ocene", icon: BarChart3, emoji: "📊" },
  { name: "Fokus", href: "/dashboard/fokus", icon: Clock, emoji: "🧠" },
  { name: "AI Tutor", href: "/dashboard/ai-tutor", icon: Bot, emoji: "🤖" },
  { name: "Društvo", href: "/dashboard/drustvo", icon: Users, emoji: "🤝" },
  {
    name: "Porodica",
    href: "/dashboard/porodica",
    icon: Users,
    emoji: "👨‍👩‍👧‍👦",
  },
  {
    name: "Profil",
    href: "/dashboard/profil",
    icon: Users,
    emoji: "👤",
  },
  {
    name: "Podešavanja",
    href: "/settings",
    icon: Settings,
    emoji: "⚙️",
  },
];
