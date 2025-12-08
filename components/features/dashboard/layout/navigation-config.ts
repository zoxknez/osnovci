import {
  Backpack,
  BarChart3,
  BookOpen,
  Bot,
  Calendar,
  Clock,
  Heart,
  Home,
  ShoppingBag,
  Trophy,
  UserCircle,
  Users,
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
    icon: Heart,
    emoji: "👨‍👩‍👧‍👦",
  },
  {
    name: "Postignuća",
    href: "/dashboard/postignuca",
    icon: Trophy,
    emoji: "🏆",
  },
  {
    name: "Pernica",
    href: "/dashboard/pernica",
    icon: Backpack,
    emoji: "🎒",
  },
  {
    name: "Prodavnica",
    href: "/dashboard/prodavnica",
    icon: ShoppingBag,
    emoji: "🛒",
  },
  {
    name: "Profil",
    href: "/dashboard/profil",
    icon: UserCircle,
    emoji: "👤",
  },
];
