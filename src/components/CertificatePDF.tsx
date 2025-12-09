import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface CertificatePDFProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  score: number;
}

export const CertificatePDF = ({ 
  studentName, 
  courseName, 
  completionDate,
  score
}: CertificatePDFProps) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!certificateRef.current) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para baixar o certificado.');
      return;
    }

    const formattedDate = new Date(completionDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    // Certificate HTML content
    const certificateHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificado - ${courseName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: A4 landscape;
            margin: 0;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            background: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          
          .certificate {
            width: 297mm;
            height: 210mm;
            background: linear-gradient(135deg, #fef9f3 0%, #fff5eb 50%, #fef9f3 100%);
            border: 12px solid #FF6B35;
            border-radius: 16px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          }
          
          .certificate::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 2px solid #FF6B35;
            border-radius: 8px;
            opacity: 0.3;
          }
          
          .inner-border {
            position: absolute;
            top: 30px;
            left: 30px;
            right: 30px;
            bottom: 30px;
            border: 1px dashed #FF6B35;
            border-radius: 4px;
            opacity: 0.4;
          }
          
          .content {
            position: relative;
            z-index: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 50px 80px;
            text-align: center;
          }
          
          .logo-container {
            margin-bottom: 20px;
          }
          
          .logo-text {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            color: #FF6B35;
            letter-spacing: 2px;
          }
          
          .logo-subtitle {
            font-size: 12px;
            color: #666;
            letter-spacing: 4px;
            text-transform: uppercase;
            margin-top: 4px;
          }
          
          .title {
            font-family: 'Playfair Display', serif;
            font-size: 48px;
            font-weight: 600;
            color: #2D1B0E;
            margin: 20px 0 10px;
            letter-spacing: 3px;
          }
          
          .subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
            letter-spacing: 1px;
          }
          
          .student-name {
            font-family: 'Playfair Display', serif;
            font-size: 42px;
            font-weight: 700;
            color: #FF6B35;
            margin: 15px 0;
            border-bottom: 3px solid #FF6B35;
            padding-bottom: 10px;
            min-width: 400px;
          }
          
          .course-text {
            font-size: 18px;
            color: #444;
            margin: 20px 0;
            line-height: 1.6;
          }
          
          .course-name {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 600;
            color: #2D1B0E;
            margin: 10px 0;
          }
          
          .score-badge {
            background: linear-gradient(135deg, #FF6B35, #FF8B5E);
            color: white;
            padding: 8px 24px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            margin: 15px 0;
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
          }
          
          .date {
            font-size: 14px;
            color: #666;
            margin-top: 25px;
          }
          
          .footer {
            position: absolute;
            bottom: 50px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            gap: 150px;
          }
          
          .signature {
            text-align: center;
          }
          
          .signature-line {
            width: 180px;
            border-top: 2px solid #2D1B0E;
            margin-bottom: 8px;
          }
          
          .signature-text {
            font-size: 12px;
            color: #666;
          }
          
          .decorative-corner {
            position: absolute;
            width: 80px;
            height: 80px;
            border: 3px solid #FF6B35;
            opacity: 0.6;
          }
          
          .corner-tl {
            top: 40px;
            left: 40px;
            border-right: none;
            border-bottom: none;
          }
          
          .corner-tr {
            top: 40px;
            right: 40px;
            border-left: none;
            border-bottom: none;
          }
          
          .corner-bl {
            bottom: 40px;
            left: 40px;
            border-right: none;
            border-top: none;
          }
          
          .corner-br {
            bottom: 40px;
            right: 40px;
            border-left: none;
            border-top: none;
          }
          
          .fox-icon {
            font-size: 40px;
            margin-bottom: 5px;
          }
          
          @media print {
            body {
              padding: 0;
              background: white;
            }
            
            .certificate {
              box-shadow: none;
              margin: 0;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="decorative-corner corner-tl"></div>
          <div class="decorative-corner corner-tr"></div>
          <div class="decorative-corner corner-bl"></div>
          <div class="decorative-corner corner-br"></div>
          <div class="inner-border"></div>
          
          <div class="content">
            <div class="logo-container">
              <div class="fox-icon">🦊</div>
              <div class="logo-text">Aula Click</div>
              <div class="logo-subtitle">Educação Inteligente</div>
            </div>
            
            <h1 class="title">CERTIFICADO</h1>
            <p class="subtitle">DE CONCLUSÃO DE CURSO</p>
            
            <p class="course-text">Certificamos que</p>
            
            <h2 class="student-name">${studentName}</h2>
            
            <p class="course-text">
              concluiu com êxito o curso
            </p>
            
            <h3 class="course-name">${courseName}</h3>
            
            <div class="score-badge">
              Aprovado com ${score}% de aproveitamento
            </div>
            
            <p class="date">
              Emitido em ${formattedDate}
            </p>
            
            <div class="footer">
              <div class="signature">
                <div class="signature-line"></div>
                <p class="signature-text">Aula Click</p>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(certificateHTML);
    printWindow.document.close();
  };

  return (
    <Button 
      onClick={handleDownload}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Baixar Certificado (PDF)
    </Button>
  );
};
