import { db } from "@/db";
import { reports, users, stores } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportStatusControl } from "./report-status-control";
import Link from "next/link";
import { ExternalLink, Flag } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports — Admin" };

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "OPEN":
      return <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">Open</Badge>;
    case "REVIEWED":
      return <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200">Reviewed</Badge>;
    case "RESOLVED":
      return <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">Resolved</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function AdminReportsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const adminUser = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
  if (!adminUser || adminUser.role !== "ADMIN") redirect("/");

  const allReports = await db.query.reports.findMany({
    with: {
      store: true,
      reporter: true,
    },
    orderBy: [desc(reports.createdAt)],
  });

  const openCount = allReports.filter((r) => r.status === "OPEN").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Reports</h1>
          <p className="text-stone-500 mt-1">Buyer-submitted vendor reports.</p>
        </div>
        <div className="flex gap-2">
          {openCount > 0 && (
            <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">
              <Flag className="w-3 h-3 mr-1" />
              {openCount} open
            </Badge>
          )}
          <Badge variant="outline" className="text-stone-600">{allReports.length} total</Badge>
        </div>
      </div>

      {allReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
          <Flag className="w-8 h-8 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">No reports submitted yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-stone-50">
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allReports.map((report) => (
                <TableRow
                  key={report.id}
                  className={`hover:bg-stone-50/50 ${report.status === "OPEN" ? "bg-red-50/30" : ""}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-stone-900">{report.store?.name || "—"}</span>
                      {report.store?.slug && (
                        <Link href={`/store/${report.store.slug}`} target="_blank" className="text-stone-400 hover:text-primary-600">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-stone-600 text-sm">
                    {report.reporter
                      ? `${report.reporter.firstName || ""} ${report.reporter.lastName || ""}`.trim() || report.reporter.email
                      : "—"}
                  </TableCell>
                  <TableCell className="text-stone-700 text-sm font-medium max-w-[180px]">
                    {report.reason}
                  </TableCell>
                  <TableCell className="text-stone-500 text-sm max-w-[240px]">
                    <p className="line-clamp-2">{report.details || "—"}</p>
                  </TableCell>
                  <TableCell className="text-stone-500 text-sm whitespace-nowrap">
                    {format(new Date(report.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={report.status} />
                  </TableCell>
                  <TableCell>
                    <ReportStatusControl reportId={report.id} currentStatus={report.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
