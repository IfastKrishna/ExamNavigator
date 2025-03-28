import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
}

export default function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <Card className={cn("transition-colors duration-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <a href="#" className="text-sm text-primary dark:text-accent hover:underline">View All</a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, index) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {/* Line connecting dots */}
                  {index < activities.length - 1 && (
                    <span 
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" 
                      aria-hidden="true"
                    />
                  )}
                  
                  <div className="relative flex space-x-3">
                    {/* Activity Icon */}
                    <div>
                      <span className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        {
                          'bg-blue-500': activity.type === 'user',
                          'bg-green-500': activity.type === 'exam',
                          'bg-yellow-500': activity.type === 'certificate',
                          'bg-red-500': activity.type === 'system'
                        }
                      )}>
                        <activity.icon className="text-white text-sm" />
                      </span>
                    </div>
                    
                    {/* Activity Content */}
                    <div className="min-w-0 flex-1 pt-1.5">
                      <p className="text-sm text-gray-800 dark:text-gray-200" 
                         dangerouslySetInnerHTML={{ __html: activity.content }}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {activity.timeAgo}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
