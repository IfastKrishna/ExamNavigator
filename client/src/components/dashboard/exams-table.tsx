import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Exam } from "@shared/schema";
import { EyeIcon } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface ExamsTableProps {
  exams: (Exam & { academyName?: string })[];
  showViewAll?: boolean;
  showAcademy?: boolean;
}

export default function ExamsTable({ exams, showViewAll = true, showAcademy = true }: ExamsTableProps) {
  return (
    <Card className="transition-colors duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Recent Exams</CardTitle>
          <div className="flex space-x-2">
            {showViewAll && (
              <Link href="/exams">
                <a className="text-sm text-primary dark:text-accent hover:underline">View All</a>
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                {showAcademy && <TableHead>Academy</TableHead>}
                <TableHead>Students</TableHead>
                <TableHead>Pass Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <TableCell>
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{exam.title}</div>
                    </div>
                  </TableCell>
                  {showAcademy && (
                    <TableCell>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{exam.academyName || "-"}</div>
                    </TableCell>
                  )}
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {exam.studentsCount || "0"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                          className={cn(
                            "h-2.5 rounded-full",
                            exam.passRate >= 70 ? "bg-green-500" : 
                            exam.passRate >= 50 ? "bg-yellow-500" : "bg-red-500"
                          )} 
                          style={{ width: `${exam.passRate || 0}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">{exam.passRate || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={exam.status === "PUBLISHED" ? "success" : 
                               exam.status === "DRAFT" ? "secondary" : "outline"}
                    >
                      {exam.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/exams/${exam.id}`}>
                      <a className="text-primary dark:text-accent hover:text-secondary dark:hover:text-blue-300">
                        <EyeIcon className="h-4 w-4 inline" />
                      </a>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
