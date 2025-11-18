/**
 * Admin Rate Limit Monitoring Dashboard
 * View and manage rate limit violations and blocks
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  AlertTriangle, 
  Ban,
  RefreshCw,
  Users,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface ViolationRecord {
  identifier: string;
  count: number;
  firstViolation: number;
  lastViolation: number;
  blocked: boolean;
  blockedUntil?: number;
}

interface RateLimitStats {
  total: number;
  activeBlocks: number;
  highViolators: number;
}

export default function RateLimitDashboard() {
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);

  useEffect(() => {
    fetchViolations();
  }, []);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/rate-limits");
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setViolations(data.violations || []);
      setStats(data.stats || null);
    } catch (error) {
      toast.error("Failed to load rate limit data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetViolations = async (identifier: string) => {
    try {
      setResetting(identifier);
      
      const response = await fetch("/api/admin/rate-limits/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      if (!response.ok) throw new Error("Failed to reset");

      toast.success("Violations reset successfully");
      fetchViolations();
    } catch (error) {
      toast.error("Failed to reset violations");
      console.error(error);
    } finally {
      setResetting(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("sr-RS");
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}min`;
  };

  const getViolationBadge = (count: number) => {
    if (count >= 5) return <Badge variant="destructive">Critical ({count})</Badge>;
    if (count >= 3) return <Badge variant="outline" className="border-orange-500 text-orange-600">High ({count})</Badge>;
    return <Badge variant="outline">Moderate ({count})</Badge>;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 animate-pulse text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading rate limit data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rate Limit Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor and manage API rate limit violations
          </p>
        </div>
        <Button onClick={fetchViolations} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Violators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Blocks</CardTitle>
              <Ban className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.activeBlocks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Violators</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.highViolators}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Violations List */}
      <Card>
        <CardHeader>
          <CardTitle>Violation Records ({violations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {violations.length === 0 ? (
              <div className="py-12 text-center">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No violations recorded</p>
              </div>
            ) : (
              violations.map((violation) => (
                <div
                  key={violation.identifier}
                  className="rounded-lg border p-4 hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {violation.identifier}
                        </code>
                        {getViolationBadge(violation.count)}
                        {violation.blocked && (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="h-3 w-3" />
                            Blocked
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">First Violation:</span>{" "}
                          {formatDate(violation.firstViolation)}
                        </div>
                        <div>
                          <span className="font-medium">Last Violation:</span>{" "}
                          {formatDate(violation.lastViolation)}
                        </div>
                        {violation.blocked && violation.blockedUntil && (
                          <div className="col-span-2 flex items-center gap-2 text-red-600">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">Blocked Until:</span>{" "}
                            {formatDate(violation.blockedUntil)} (
                            {formatDuration(violation.blockedUntil - Date.now())})
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetViolations(violation.identifier)}
                      disabled={resetting === violation.identifier}
                    >
                      {resetting === violation.identifier ? (
                        <>
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        "Reset"
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
