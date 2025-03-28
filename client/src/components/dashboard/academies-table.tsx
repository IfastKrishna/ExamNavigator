import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Academy } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EyeIcon } from "lucide-react";
import { Link } from "wouter";

interface AcademiesTableProps {
  academies: Academy[];
  showViewAll?: boolean;
}

export default function AcademiesTable({ academies, showViewAll = true }: AcademiesTableProps) {
  return (
    <Card className="transition-colors duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Recent Academies</CardTitle>
          {showViewAll && (
            <Link href="/academies">
              <a className="text-sm text-primary dark:text-accent hover:underline">View All</a>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Exams</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {academies.map((academy) => (
                <TableRow key={academy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 bg-gray-200 dark:bg-gray-600">
                        <AvatarFallback className="text-gray-500 dark:text-gray-300">
                          {academy.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{academy.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {academy.studentsCount || "0"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {academy.examsCount || "0"}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={academy.status === "ACTIVE" ? "success" : 
                              academy.status === "PENDING" ? "warning" : "secondary"}
                    >
                      {academy.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/academies/${academy.id}`}>
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
