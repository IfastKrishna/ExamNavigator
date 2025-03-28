import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CertificatePreviewProps {
  certificate: {
    id: number;
    studentName: string;
    examName: string;
    score: number;
    academyName: string;
    issueDate: Date;
    certificateNumber: string;
  };
  onEdit?: () => void;
  className?: string;
}

export default function CertificatePreview({ certificate, onEdit, className }: CertificatePreviewProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Certificate Template</CardTitle>
          {onEdit && (
            <Button size="sm" onClick={onEdit}>
              <EditIcon className="h-4 w-4 mr-1" /> Edit Template
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
          <div className="relative aspect-[1.414/1] max-w-2xl mx-auto border-8 border-blue-100 dark:border-blue-900 p-8 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-lg text-center">
            {/* Certificate Header */}
            <div className="mb-6">
              <div className="text-primary dark:text-accent text-3xl font-bold mb-2">CERTIFICATE OF ACHIEVEMENT</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">This certifies that</div>
            </div>
            
            {/* Student Name */}
            <div className="text-2xl font-bold text-gray-800 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 pb-2 mb-4">
              {certificate.studentName}
            </div>
            
            {/* Certificate Text */}
            <div className="mb-6 text-gray-700 dark:text-gray-300">
              has successfully completed the 
              <span className="font-semibold text-gray-800 dark:text-white"> {certificate.examName} </span> 
              exam with a score of 
              <span className="font-semibold text-gray-800 dark:text-white"> {certificate.score}% </span>
            </div>
            
            {/* Academy & Date */}
            <div className="mb-8 text-sm text-gray-600 dark:text-gray-400">
              Issued by <span className="font-medium">{certificate.academyName}</span> on <span>{formatDate(certificate.issueDate)}</span>
            </div>
            
            {/* Signatures */}
            <div className="flex justify-around mt-6">
              <div className="text-center">
                <div className="h-12 mb-2 flex items-end justify-center">
                  <svg width="120" height="30" viewBox="0 0 120 30" className="h-full">
                    <path 
                      d="M10,15 Q30,5 50,15 T90,15" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      className="text-primary dark:text-accent"
                    />
                  </svg>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 border-t border-gray-300 dark:border-gray-700 pt-1 w-32 mx-auto">
                  Academy Director
                </div>
              </div>
              
              <div className="text-center">
                <div className="h-12 mb-2 flex items-end justify-center">
                  <div className="h-10 w-10">
                    <div className="h-full w-full rounded-full border-2 border-primary dark:border-accent flex items-center justify-center">
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="h-5 w-5 text-primary dark:text-accent"
                      >
                        <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 border-t border-gray-300 dark:border-gray-700 pt-1 w-32 mx-auto">
                  Official Seal
                </div>
              </div>
            </div>
            
            {/* Certificate ID */}
            <div className="absolute bottom-4 left-4 text-xs text-gray-500 dark:text-gray-500">
              Certificate ID: <span>{certificate.certificateNumber}</span>
            </div>
            
            {/* Verification Link */}
            <div className="absolute bottom-4 right-4 text-xs text-gray-500 dark:text-gray-500">
              Verify at: examportal.com/verify
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
