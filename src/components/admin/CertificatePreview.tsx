import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Award, Download, Eye, RefreshCw } from "lucide-react";

export const CertificatePreview = () => {
  const [studentName, setStudentName] = useState("Nome do Estudante");
  const [courseName, setCourseName] = useState("Inglês A1 - Iniciante");
  const [score, setScore] = useState(85);
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const formattedDate = new Date(completionDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const generateCertificateHTML = () => `
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
          background: #f5f5f5;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }
        
        .certificate {
          width: 100%;
          max-width: 900px;
          aspect-ratio: 297/210;
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
          padding: 40px 60px;
          text-align: center;
        }
        
        .logo-container {
          margin-bottom: 15px;
        }
        
        .logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: #FF6B35;
          letter-spacing: 2px;
        }
        
        .logo-subtitle {
          font-size: 11px;
          color: #666;
          letter-spacing: 4px;
          text-transform: uppercase;
          margin-top: 4px;
        }
        
        .title {
          font-family: 'Playfair Display', serif;
          font-size: 38px;
          font-weight: 600;
          color: #2D1B0E;
          margin: 15px 0 8px;
          letter-spacing: 3px;
        }
        
        .subtitle {
          font-size: 14px;
          color: #666;
          margin-bottom: 20px;
          letter-spacing: 1px;
        }
        
        .student-name {
          font-family: 'Playfair Display', serif;
          font-size: 34px;
          font-weight: 700;
          color: #FF6B35;
          margin: 12px 0;
          border-bottom: 3px solid #FF6B35;
          padding-bottom: 8px;
          min-width: 300px;
        }
        
        .course-text {
          font-size: 16px;
          color: #444;
          margin: 15px 0;
          line-height: 1.6;
        }
        
        .course-name {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 600;
          color: #2D1B0E;
          margin: 8px 0;
        }
        
        .score-badge {
          background: linear-gradient(135deg, #FF6B35, #FF8B5E);
          color: white;
          padding: 6px 20px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 600;
          margin: 12px 0;
          box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
        }
        
        .date {
          font-size: 13px;
          color: #666;
          margin-top: 20px;
        }
        
        .footer {
          position: absolute;
          bottom: 40px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
        }
        
        .signature {
          text-align: center;
        }
        
        .signature-line {
          width: 150px;
          border-top: 2px solid #2D1B0E;
          margin-bottom: 6px;
        }
        
        .signature-text {
          font-size: 11px;
          color: #666;
        }
        
        .decorative-corner {
          position: absolute;
          width: 60px;
          height: 60px;
          border: 3px solid #FF6B35;
          opacity: 0.6;
        }
        
        .corner-tl {
          top: 35px;
          left: 35px;
          border-right: none;
          border-bottom: none;
        }
        
        .corner-tr {
          top: 35px;
          right: 35px;
          border-left: none;
          border-bottom: none;
        }
        
        .corner-bl {
          bottom: 35px;
          left: 35px;
          border-right: none;
          border-top: none;
        }
        
        .corner-br {
          bottom: 35px;
          right: 35px;
          border-left: none;
          border-top: none;
        }
        
        .fox-icon {
          font-size: 32px;
          margin-bottom: 4px;
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
    </body>
    </html>
  `;

  const handlePreview = () => {
    if (previewRef.current) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(generateCertificateHTML());
        doc.close();
      }
    }
  };

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para baixar o certificado.');
      return;
    }

    const htmlWithPrint = generateCertificateHTML().replace(
      '</body>',
      '<script>window.onload = function() { window.print(); }</script></body>'
    );

    printWindow.document.write(htmlWithPrint);
    printWindow.document.close();
  };

  // Auto-refresh preview when values change
  useState(() => {
    const timeout = setTimeout(handlePreview, 100);
    return () => clearTimeout(timeout);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Preview de Certificados
        </CardTitle>
        <CardDescription>
          Visualize e gere certificados com informações personalizadas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="studentName">Nome do Estudante</Label>
            <Input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Digite o nome do estudante"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="courseName">Nome do Curso</Label>
            <Input
              id="courseName"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Digite o nome do curso"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="score">Pontuação (%)</Label>
            <Input
              id="score"
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="completionDate">Data de Conclusão</Label>
            <Input
              id="completionDate"
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handlePreview} variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Atualizar Preview
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar Certificado (PDF)
          </Button>
        </div>

        {/* Preview iframe */}
        <div className="border rounded-lg overflow-hidden bg-muted/30">
          <div className="bg-muted px-4 py-2 border-b flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Preview do Certificado</span>
          </div>
          <iframe
            ref={previewRef}
            className="w-full h-[400px] bg-white"
            title="Certificate Preview"
            onLoad={handlePreview}
          />
        </div>
      </CardContent>
    </Card>
  );
};
