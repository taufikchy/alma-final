// app/patient/educational-materials/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Card, Alert, Spinner, Accordion, Badge, Row, Col } from 'react-bootstrap';

interface EducationalMaterial {
  id: string;
  title: string;
  content: string;
  videoUrl1?: string;
  videoUrl2?: string;
  videoUrl3?: string;
}

const EducationalMaterialsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [materials, setMaterials] = useState<EducationalMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (status === 'authenticated' && (session?.user?.role === 'PATIENT' || session?.user?.role === 'MIDWIFE' || session?.user?.role === 'SUPER_ADMIN')) {
        try {
          const response = await fetch('/api/educational-materials', { credentials: 'include' });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch educational materials');
          }
          const data: EducationalMaterial[] = await response.json();
          setMaterials(data);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    fetchMaterials();
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="text-center mt-5">
          <Spinner animation="border" />
          <p className="mt-3">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!session || (session.user.role !== 'PATIENT' && session.user.role !== 'MIDWIFE' && session.user.role !== 'SUPER_ADMIN')) {
    return null;
  }

  return (
    <Layout>
      <div style={{ backgroundColor: '#FFF5F8', minHeight: '100vh' }} className="py-4">
        <Container>
          <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <Card.Body className="text-center py-4">
              <h2 className="fw-bold text-alma-green mb-2">
                <i className="bi bi-book me-2"></i>
                Materi Edukasi ALMA
              </h2>
              <p className="text-muted mb-0">Pelajari informasi penting tentang kesehatan ibu hamil</p>
            </Card.Body>
          </Card>

          {error && <Alert variant="danger" className="text-center">{error}</Alert>}

          {materials.length === 0 ? (
            <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <Card.Body className="text-center py-5">
                <i className="bi bi-book fs-1 text-muted d-block mb-3"></i>
                <p className="text-muted mb-0">Belum ada materi edukasi yang tersedia.</p>
              </Card.Body>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <Accordion>
                {materials.map((material, index) => (
                  <Accordion.Item key={material.id} eventKey={String(index)}>
                    <Accordion.Header
                      style={{ backgroundColor: index % 2 === 0 ? '#E8F5E9' : '#FFF3E0' }}
                      className="fw-bold"
                    >
                      <span className="d-flex align-items-center">
                        <i className={`bi ${index === 0 ? 'bi-droplet-fill' : index === 1 ? 'bi-exclamation-triangle-fill' : index === 2 ? 'bi-heart-pulse' : index === 3 ? 'bi-exclamation-circle-fill' : 'bi-shield-check'} me-2 fs-5`}
                          style={{ color: index === 0 ? '#E91E63' : index === 1 ? '#FF9800' : index === 2 ? '#E91E63' : index === 3 ? '#FF9800' : '#2196F3' }}
                        ></i>
                        {material.title}
                      </span>
                    </Accordion.Header>
                    <Accordion.Body>
                      <div className="mb-3" dangerouslySetInnerHTML={{ __html: material.content }} />

                      {(material.videoUrl1 || material.videoUrl2 || material.videoUrl3) && (
                        <div className="mt-4">
                          <Badge bg="info" className="mb-3 px-3 py-2" style={{ fontSize: '0.9rem' }}>
                            <i className="bi bi-play-circle me-1"></i>
                            Video Edukasi
                          </Badge>
                          <Row>
                            {material.videoUrl1 && (
                              <Col md={4} className="mb-3">
                                <div className="ratio ratio-16x9 rounded overflow-hidden shadow-sm">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${material.videoUrl1}`}
                                    allowFullScreen
                                    title="Video Edukasi 1"
                                  ></iframe>
                                </div>
                              </Col>
                            )}
                            {material.videoUrl2 && (
                              <Col md={4} className="mb-3">
                                <div className="ratio ratio-16x9 rounded overflow-hidden shadow-sm">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${material.videoUrl2}`}
                                    allowFullScreen
                                    title="Video Edukasi 2"
                                  ></iframe>
                                </div>
                              </Col>
                            )}
                            {material.videoUrl3 && (
                              <Col md={4} className="mb-3">
                                <div className="ratio ratio-16x9 rounded overflow-hidden shadow-sm">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${material.videoUrl3}`}
                                    allowFullScreen
                                    title="Video Edukasi 3"
                                  ></iframe>
                                </div>
                              </Col>
                            )}
                          </Row>
                        </div>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Card>
          )}

          <Card className="mt-4 border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#E3F2FD' }}>
            <Card.Body className="text-center py-3">
              <i className="bi bi-info-circle me-2 text-primary"></i>
              <small className="text-muted">
                Klik setiap materi untuk melihat penjelasan lengkap
              </small>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </Layout>
  );
};

export default EducationalMaterialsPage;
