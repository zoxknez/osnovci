/**
 * Admin Moderation Dashboard
 * View and manage all content moderation logs
 */

"use client";

import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Flag,
  Shield,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ModerationLog {
  id: string;
  contentType: string;
  originalText: string;
  moderatedText: string | null;
  status: string;
  flagged: boolean;
  severity: string | null;
  flaggedWords: string | null;
  aiProvider: string | null;
  aiConfidence: number | null;
  hasPII: boolean;
  piiTypes: string | null;
  actionTaken: string | null;
  notifyParent: boolean;
  parentNotified: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface ModerationStats {
  total: number;
  flagged: number;
  blocked: number;
  pending: number;
  approved: number;
  flagRate: number;
}

export default function AdminModerationDashboard() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ModerationLog | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFlagged, setFilterFlagged] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, [filterStatus, filterFlagged]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterFlagged === "true") params.set("flagged", "true");

      const response = await fetch(`/api/admin/moderation?${params}`);
      if (!response.ok) throw new Error("Failed to fetch logs");

      const data = await response.json();
      setLogs(data.logs);

      // Calculate stats
      const total = data.pagination.total;
      const flagged = data.logs.filter((l: ModerationLog) => l.flagged).length;
      const blocked = data.logs.filter(
        (l: ModerationLog) => l.status === "REJECTED",
      ).length;
      const pending = data.logs.filter(
        (l: ModerationLog) => l.status === "PENDING",
      ).length;
      const approved = data.logs.filter(
        (l: ModerationLog) => l.status === "APPROVED",
      ).length;

      setStats({
        total,
        flagged,
        blocked,
        pending,
        approved,
        flagRate: total > 0 ? (flagged / total) * 100 : 0,
      });
    } catch (error) {
      toast.error("Failed to load moderation logs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const reviewLog = async (logId: string) => {
    if (!reviewStatus) {
      toast.error("Please select a status");
      return;
    }

    try {
      const response = await fetch(`/api/admin/moderation/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewStatus,
          reviewNotes: reviewNotes || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to review log");

      toast.success("Log reviewed successfully");
      setSelectedLog(null);
      setReviewStatus("");
      setReviewNotes("");
      fetchLogs();
    } catch (error) {
      toast.error("Failed to review log");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "destructive" | "secondary" | "outline";
        icon: any;
      }
    > = {
      APPROVED: { variant: "secondary", icon: CheckCircle },
      REJECTED: { variant: "destructive", icon: XCircle },
      FLAGGED: { variant: "outline", icon: Flag },
      PENDING: { variant: "default", icon: AlertTriangle },
    };

    const config = variants[status] ?? variants["PENDING"];
    const Icon = config?.icon ?? AlertTriangle;

    return (
      <Badge variant={config?.variant ?? "default"} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getSeverityColor = (severity: string | null) => {
    const colors: Record<string, string> = {
      critical: "text-red-600",
      severe: "text-orange-600",
      moderate: "text-yellow-600",
      mild: "text-blue-600",
      none: "text-gray-600",
    };
    return colors[severity || "none"] || "text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 animate-pulse text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Loading moderation logs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground">
            Monitor and manage all moderated content
          </p>
        </div>
        <Button onClick={fetchLogs} variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Checks
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <Flag className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.flagged}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.flagRate.toFixed(1)}% flag rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.blocked}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Review
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pending}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FLAGGED">Flagged</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterFlagged} onValueChange={setFilterFlagged}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Flagged" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Flagged Only</SelectItem>
              <SelectItem value="false">Not Flagged</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Logs ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="py-12 text-center">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No logs found</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(log.status)}
                        <Badge variant="outline">{log.contentType}</Badge>
                        {log.flagged && (
                          <Badge variant="outline" className="gap-1">
                            <Flag className="h-3 w-3" />
                            Flagged
                          </Badge>
                        )}
                        {log.hasPII && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            PII
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {log.originalText}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {log.severity && (
                          <span className={getSeverityColor(log.severity)}>
                            Severity: {log.severity}
                          </span>
                        )}
                        {log.aiConfidence && (
                          <span>
                            AI Confidence: {log.aiConfidence.toFixed(1)}%
                          </span>
                        )}
                        <span>
                          {new Date(log.createdAt).toLocaleDateString("sr")}
                        </span>
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      <Eye className="mr-1 h-3 w-3" />
                      Review
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Review Moderation Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold">Original Text</h4>
                <p className="rounded border p-3 text-sm">
                  {selectedLog.originalText}
                </p>
              </div>

              {selectedLog.moderatedText && (
                <div>
                  <h4 className="mb-2 font-semibold">Moderated Text</h4>
                  <p className="rounded border bg-muted p-3 text-sm">
                    {selectedLog.moderatedText}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-2 font-semibold">Status</h4>
                  {getStatusBadge(selectedLog.status)}
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">Action Taken</h4>
                  <Badge>{selectedLog.actionTaken}</Badge>
                </div>
              </div>

              {selectedLog.flaggedWords && (
                <div>
                  <h4 className="mb-2 font-semibold">Flagged Words</h4>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedLog.flaggedWords).map(
                      (word: string, i: number) => (
                        <Badge key={i} variant="destructive">
                          {word}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="mb-2 font-semibold">Review Status</h4>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVED">Approve</SelectItem>
                    <SelectItem value="REJECTED">Reject</SelectItem>
                    <SelectItem value="FLAGGED">Flag for Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Review Notes (Optional)</h4>
                <Textarea
                  value={reviewNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setReviewNotes(e.target.value)
                  }
                  placeholder="Add notes about your decision..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedLog(null);
                    setReviewStatus("");
                    setReviewNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => reviewLog(selectedLog.id)}>
                  Submit Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
