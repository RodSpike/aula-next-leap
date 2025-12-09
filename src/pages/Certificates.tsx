import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { CertificatePDF } from "@/components/CertificatePDF";

interface Certificate {
  id: string;
  course_name: string;
  certificate_type: string;
  issued_date: string;
  created_at: string;
}

interface Profile {
  display_name: string | null;
  email: string;
}

export default function Certificates() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certificatesLoading, setCertificatesLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && !loading) {
      fetchCertificates();
      fetchProfile();
    }
  }, [user, loading]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchCertificates = async () => {
    try {
      setCertificatesLoading(true);
      
      const { data: certificatesData, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCertificates(certificatesData || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setCertificatesLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCertificateIcon = (type: string) => {
    switch (type) {
      case 'level_advancement':
        return <Trophy className="h-8 w-8 text-yellow-600" />;
      case 'completion':
        return <Award className="h-8 w-8 text-primary" />;
      default:
        return <Award className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStudentName = () => {
    return profile?.display_name || profile?.email || 'Aluno';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando certificados...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Seus Certificados</h1>
          <p className="text-muted-foreground">
            Acompanhe suas conquistas e baixe seus certificados
          </p>
        </div>

        {/* Certificates Grid */}
        {certificatesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {getCertificateIcon(certificate.certificate_type)}
                  </div>
                  <CardTitle className="text-lg">{certificate.course_name}</CardTitle>
                  <Badge variant="secondary" className="mx-auto">
                    {certificate.certificate_type === 'level_advancement' 
                      ? 'Avanço de Nível' 
                      : 'Conclusão de Curso'
                    }
                  </Badge>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Emitido: {formatDate(certificate.issued_date)}</span>
                  </div>
                  
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-2xl mb-2">🏆</div>
                    <p className="text-sm font-medium">
                      Parabéns pela sua conquista!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Certificado emitido em {formatDate(certificate.created_at)}
                    </p>
                  </div>

                  <CertificatePDF
                    studentName={getStudentName()}
                    courseName={certificate.course_name}
                    completionDate={certificate.issued_date}
                    score={70}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Nenhum Certificado Ainda</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Complete cursos com no mínimo 70% de aproveitamento para receber seus certificados. 
              Comece a aprender hoje!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate('/courses')}>
                Ver Cursos
              </Button>
              <Button variant="outline" onClick={() => navigate('/placement-test')}>
                Fazer Teste de Nivelamento
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}