import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, MapPin, DollarSign, Clock } from "lucide-react";
import { Link } from "wouter";

interface ReportActivity {
  id: number;
  type: string;
  status: string;
  data: any;
  createdAt: string;
  metadata?: {
    reportData?: {
      propertyAddress: string;
      projectDescription: string;
      budgetRange: string;
      timeframe: string;
    };
  };
}

export default function ReportGenerator() {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      const response = await fetch("/api/activities");
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
  });

  const downloadReport = async (reportId: number) => {
    setDownloadingId(reportId);
    try {
      const response = await fetch(`/api/activities/${reportId}/pdf`);
      if (!response.ok) throw new Error("Failed to download report");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `property-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your reports...</p>
        </div>
      </div>
    );
  }

  const reportActivities = activities?.filter((activity: ReportActivity) => 
    activity.type === "premium_report" || activity.type === "property_report"
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Your Property Reports
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            View and download your comprehensive property development reports
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/report-questions">
            <Button className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Request New Report
            </Button>
          </Link>
          <Link href="/premium-chat">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Chat with Experts
            </Button>
          </Link>
        </div>

        {/* Reports List */}
        {reportActivities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportActivities.map((activity: ReportActivity) => (
              <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      Property Report #{activity.id}
                    </CardTitle>
                    {getStatusBadge(activity.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activity.metadata?.reportData && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Property Address</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {activity.metadata.reportData.propertyAddress}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Budget Range</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {activity.metadata.reportData.budgetRange}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Timeframe</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {activity.metadata.reportData.timeframe}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    Created {formatDate(activity.createdAt)}
                  </div>

                  {activity.status === "completed" && (
                    <Button
                      onClick={() => downloadReport(activity.id)}
                      disabled={downloadingId === activity.id}
                      className="w-full"
                      size="sm"
                    >
                      {downloadingId === activity.id ? (
                        "Downloading..."
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </>
                      )}
                    </Button>
                  )}

                  {activity.status === "pending" && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      Report processing will begin shortly
                    </div>
                  )}

                  {activity.status === "in_progress" && (
                    <div className="text-sm text-blue-600 dark:text-blue-400 text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                      Our experts are analyzing your property
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Reports Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You haven't requested any property reports yet. Start by requesting a comprehensive analysis of your development project.
              </p>
              <Link href="/report-questions">
                <Button className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Request Your First Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}