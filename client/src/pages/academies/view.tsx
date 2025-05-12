import MainLayout from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Academy } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useLocation, useParams } from "wouter";

export default function AcademyView() {
    const academyId = useParams<{ academyId: string }>().academyId;
    const [, setLocation] = useLocation();

    // Fetch academies
  const { data: academies, isLoading } = useQuery<Academy>({
    queryKey: ["/api/academies/", academyId],
    queryFn: async () => {
      const res = await apiRequest("GET",`/api/academies/${academyId}`);
      if (!res.ok) throw new Error("Failed to fetch academy details");
      const data = await res.json();
      return data;
    },
  });
    console.log("Academy ID:", academyId), console.log("Academies:", academies);
    return (
        <MainLayout title="Academy Details" subtitle="View and manage academy details">
            <div className="mb-6">
            <Button 
                variant="outline" 
                onClick={() => setLocation("/academies")}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Academies
            </Button>
            </div>
           <Card>
                <CardContent className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <p className="dark:text-gray-300">Loading academy details...</p>
                        </div>
                    ) : academies ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                {academies.logoUrl ? (
                                    <img 
                                        src={academies.logoUrl} 
                                        alt={`${academies.name} logo`} 
                                        className="w-20 h-20 rounded-md object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                        <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                                            {academies.name?.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-2xl font-bold dark:text-white">{academies.name}</h2>
                                    <div className="flex items-center mt-1">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            academies.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                            {academies.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {academies.description && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
                                    <p className="text-gray-700 dark:text-gray-300">{academies.description}</p>
                                </div>
                            )}

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Contact Information</h3>
                                    <ul className="space-y-2">
                                        {academies.contactEmail && (
                                            <li className="flex items-center gap-2">
                                                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                                                <a href={`mailto:${academies.contactEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                                    {academies.contactEmail}
                                                </a>
                                            </li>
                                        )}
                                        {academies.contactPhone && (
                                            <li className="flex items-center gap-2">
                                                <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                                                <a href={`tel:${academies.contactPhone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                                    {academies.contactPhone}
                                                </a>
                                            </li>
                                        )}
                                        {academies.website && (
                                            <li className="flex items-center gap-2">
                                                <span className="text-gray-500 dark:text-gray-400">Website:</span>
                                                <a href={academies.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                                    {academies.website}
                                                </a>
                                            </li>
                                        )}
                                        {academies.location && (
                                            <li className="flex items-center gap-2">
                                                <span className="text-gray-500 dark:text-gray-400">Location:</span>
                                                <span className="dark:text-gray-300">{academies.location}</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Additional Information</h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2">
                                            <span className="text-gray-500 dark:text-gray-400">Academy ID:</span>
                                            <span className="dark:text-gray-300">{academies.id}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-gray-500 dark:text-gray-400">Created:</span>
                                            <span className="dark:text-gray-300">{new Date(academies.createdAt || "").toLocaleDateString()}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-48">
                            <p className="text-red-500 dark:text-red-400">Academy not found</p>
                        </div>
                    )}
                </CardContent>
           </Card>
        </MainLayout>
    )
}