/**
 * Admin Dashboard - Main Index Page
 * Overview of all admin functionality
 */

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  Gauge,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Admin Panel | Osnovci",
  description: "Administratorska kontrolna tabla",
};

export default async function AdminIndexPage() {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    redirect("/prijava");
  }

  // Check admin role
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch stats for dashboard
  const [
    totalUsers,
    totalStudents,
    totalGuardians,
    pendingModerations,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.guardian.count(),
    prisma.moderationLog.count({ where: { status: "PENDING" } }),
    prisma.activityLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const adminCards = [
    {
      title: "Moderacija sadržaja",
      description: "Pregled i upravljanje prijavljenim sadržajem",
      href: "/admin/moderation",
      icon: Shield,
      color: "text-red-500",
      bgColor: "bg-red-50",
      stat: pendingModerations,
      statLabel: "na čekanju",
    },
    {
      title: "Rate Limiti",
      description: "Upravljanje ograničenjima API poziva",
      href: "/admin/rate-limits",
      icon: Gauge,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      stat: null,
      statLabel: null,
    },
    {
      title: "Korisnici",
      description: "Pregled svih registrovanih korisnika",
      href: "/admin/users",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      stat: totalUsers,
      statLabel: "ukupno",
    },
    {
      title: "Aktivnost",
      description: "Logovi aktivnosti korisnika",
      href: "/admin/activity",
      icon: Activity,
      color: "text-green-500",
      bgColor: "bg-green-50",
      stat: recentActivity,
      statLabel: "poslednjih 24h",
    },
  ];

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="h-8 w-8 text-purple-600" />
          Admin Panel
        </h1>
        <p className="text-gray-600">
          Dobrodošli, {session.user.email}. Upravljajte platformom Osnovci.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Ukupno korisnika</p>
                <p className="text-3xl font-bold">{totalUsers}</p>
              </div>
              <Users className="h-10 w-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Učenika</p>
                <p className="text-3xl font-bold">{totalStudents}</p>
              </div>
              <BarChart3 className="h-10 w-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Roditelja</p>
                <p className="text-3xl font-bold">{totalGuardians}</p>
              </div>
              <Shield className="h-10 w-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`${pendingModerations > 0 ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-gray-500 to-gray-600"} text-white`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Moderacija</p>
                <p className="text-3xl font-bold">{pendingModerations}</p>
              </div>
              <AlertTriangle className="h-10 w-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {adminCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${card.bgColor}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  {card.stat !== null && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {card.stat}
                      </p>
                      <p className="text-xs text-gray-500">{card.statLabel}</p>
                    </div>
                  )}
                </div>
                <CardTitle className="mt-4">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Brze akcije
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/admin/moderation"
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Shield className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Moderacija</span>
            </Link>
            <Link
              href="/admin/rate-limits"
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Gauge className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Rate limiti</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Database className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Početna</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
