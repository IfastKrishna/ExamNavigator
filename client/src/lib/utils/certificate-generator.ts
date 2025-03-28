import { Certificate } from "@shared/schema";

export interface CertificateData {
  id: number;
  certificateNumber: string;
  studentName: string;
  examName: string;
  score: number;
  academyName: string;
  issueDate: Date;
}

// This function would be used to generate a PDF certificate
// In a real implementation, this would use a library like jsPDF or react-to-pdf
export async function generateCertificatePDF(data: CertificateData): Promise<string> {
  // In a real implementation, this would generate a PDF
  // For now, we'll just return a mock URL
  return `data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDE4Pj5zdHJlYW0KeJxjYGRgYGQAACAAGgABAAH//wAPAAUADQANAAplbmRzdHJlYW0KZW5kb2JqCjQgMCBvYmoKPDwvQ29udGVudHMgNSAwIFIvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL1BhcmVudCAyIDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNiAwIFI+Pj4+L1RyaW1Cb3hbMCAwIDU5NSA4NDJdL1R5cGUvUGFnZT4+CmVuZG9iagoxIDAgb2JqCjw8L1BhZ2VzIDIgMCBSL1R5cGUvQ2F0YWxvZz4+CmVuZG9iagozIDAgb2JqCjw8L0NyZWF0aW9uRGF0ZShEOjIwMjExMDE5MTgzMDAwWikvTW9kRGF0ZShEOjIwMjExMDE5MTgzMDAwWikvUHJvZHVjZXIoaVRleHSuIDUuNS4xMy4zIKkyMDAwLTIwMjIgaVRleHQgR3JvdXAgTlYgXChBR1BMLXZlcnNpb25cKSk+PgplbmRvYmoKNiAwIG9iago8PC9CYXNlRm9udC9IZWx2ZXRpY2EvRW5jb2RpbmcvV2luQW5zaUVuY29kaW5nL1N1YnR5cGUvVHlwZTEvVHlwZS9Gb250Pj4KZW5kb2JqCjIgMCBvYmoKPDwvQ291bnQgMS9LaWRzWzQgMCBSXS9UeXBlL1BhZ2VzPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDIxMiAwMDAwMCBuIAowMDAwMDAwNTE3IDAwMDAwIG4gCjAwMDAwMDAyNTcgMDAwMDAgbiAKMDAwMDAwMDA5OSAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDA0MjUgMDAwMDAgbiAKdHJhaWxlcgo8PC9JRCBbPDgyZjNjOWQ5NzFjMWMyODY1Y2VmZWY2YjQ4NGRlZTRiPjw4MmYzYzlkOTcxYzFjMjg2NWNlZmVmNmI0ODRkZWU0Yj5dL0luZm8gMyAwIFIvUm9vdCAxIDAgUi9TaXplIDc+PgpzdGFydHhyZWYKNTY4CiUlRU9GCg==`;
}

// Map database certificate to UI certificate data
export function mapCertificate(
  certificate: Certificate, 
  studentName: string, 
  examName: string, 
  score: number, 
  academyName: string
): CertificateData {
  return {
    id: certificate.id,
    certificateNumber: certificate.certificateNumber,
    studentName,
    examName,
    score,
    academyName,
    issueDate: new Date(certificate.issueDate)
  };
}

// Generate a printable HTML version of the certificate
export function generateCertificateHTML(data: CertificateData): string {
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Certificate of Achievement</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          background: #fff;
        }
        .certificate {
          width: 210mm;
          height: 297mm;
          margin: 0 auto;
          padding: 20mm;
          border: 8px solid #e6f0ff;
          background: linear-gradient(to bottom right, #f0f7ff, #ffffff);
          position: relative;
          box-sizing: border-box;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .title {
          font-size: 36px;
          color: #1976D2;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 14px;
          color: #777;
        }
        .student-name {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          border-bottom: 2px solid #ddd;
          padding-bottom: 10px;
          margin-bottom: 30px;
        }
        .content {
          text-align: center;
          font-size: 16px;
          line-height: 1.5;
          color: #444;
          margin-bottom: 30px;
        }
        .highlight {
          font-weight: bold;
          color: #333;
        }
        .issue-info {
          text-align: center;
          font-size: 14px;
          color: #777;
          margin-bottom: 50px;
        }
        .signatures {
          display: flex;
          justify-content: space-around;
          margin-top: 60px;
        }
        .signature {
          text-align: center;
        }
        .signature-line {
          width: 120px;
          border-bottom: 1px solid #999;
          margin: 0 auto 10px;
          height: 40px;
        }
        .signature-title {
          font-size: 12px;
          color: #777;
          border-top: 1px solid #ddd;
          padding-top: 5px;
          width: 120px;
          margin: 0 auto;
        }
        .seal {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid #1976D2;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .seal-icon {
          font-size: 20px;
          color: #1976D2;
        }
        .certificate-id {
          position: absolute;
          bottom: 20px;
          left: 20px;
          font-size: 10px;
          color: #999;
        }
        .verify {
          position: absolute;
          bottom: 20px;
          right: 20px;
          font-size: 10px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header">
          <div class="title">CERTIFICATE OF ACHIEVEMENT</div>
          <div class="subtitle">This certifies that</div>
        </div>
        
        <div class="student-name">${data.studentName}</div>
        
        <div class="content">
          has successfully completed the 
          <span class="highlight">${data.examName}</span> 
          exam with a score of 
          <span class="highlight">${data.score}%</span>
        </div>
        
        <div class="issue-info">
          Issued by <span class="highlight">${data.academyName}</span> on <span>${formatDate(data.issueDate)}</span>
        </div>
        
        <div class="signatures">
          <div class="signature">
            <div class="signature-line"></div>
            <div class="signature-title">Academy Director</div>
          </div>
          
          <div class="signature">
            <div class="seal">
              <div class="seal-icon">★</div>
            </div>
            <div class="signature-title">Official Seal</div>
          </div>
        </div>
        
        <div class="certificate-id">Certificate ID: ${data.certificateNumber}</div>
        <div class="verify">Verify at: examportal.com/verify</div>
      </div>
    </body>
    </html>
  `;
}
