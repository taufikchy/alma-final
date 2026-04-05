// app/midwife/patients/[patientId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Card, Alert, Spinner, Row, Col, Button, Badge } from 'react-bootstrap';
import DailyCheckHistory from '@/components/DailyCheckHistory';
import Link from 'next/link';
import { calculateGestationalAge } from '@/lib/gestationalAge';

interface DailyCheck {
  id: string;
  date: string;
  takenMedication: boolean;
  photoUrl?: string;
  notes?: string;
}

interface PatientDetails {
  id: string;
  name: string;
  husbandName: string;
  age: number;
  phoneNumber: string;
  address: string;
  gestationalAge: number;
  pregnancyOrder: number;
  hasMiscarriage: boolean;
  miscarriageCount?: number;
  lastMenstrualPeriod: string;
  estimatedDueDate: string;
  lastHemoglobin: number;
  dailyChecks?: DailyCheck[];
}

const PatientDetailPage = ({ params }: { params: Promise<{ patientId: string }> }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((resolvedParams) => {
      setPatientId(resolvedParams.patientId);
    });
  }, [params]);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (status === 'authenticated' && session?.user?.role === 'MIDWIFE' && patientId) {
        try {
          const response = await fetch(`/api/patients/${patientId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch patient details');
          }
          const data: PatientDetails = await response.json();
          setPatient(data);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    fetchPatientDetails();
  }, [session, status, router, patientId]);

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

  if (!session || session.user.role !== 'MIDWIFE') {
    return null;
  }

  if (error) {
    return (
      <Layout>
        <Container className="mt-5">
          <Alert variant="danger" className="text-center">{error}</Alert>
        </Container>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout>
        <Container className="mt-5">
          <Alert variant="warning" className="text-center">Pasien tidak ditemukan.</Alert>
        </Container>
      </Layout>
    );
  }

  const getHemoglobinStatus = (hb: number) => {
    if (hb < 7) return { variant: 'danger', text: 'Rendah' };
    if (hb >= 7 && hb < 11) return { variant: 'warning', text: 'Kurang' };
    return { variant: 'success', text: 'Normal' };
  };

  return (
    <Layout>
      <div style={{ backgroundColor: '#FFF5F8', minHeight: '100vh' }} className="py-4">
        <Container>
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h3 className="mb-1 fw-bold text-alma-green">
                  <i className="bi bi-person me-2"></i>
                  Detail Pasien: {patient.name}
                </h3>
                <p className="text-muted mb-0 small">Informasi lengkap ibu hamil</p>
              </div>
              <Link href="/midwife/dashboard">
                <Button variant="secondary" className="text-center">
                  <i className="bi bi-arrow-left me-2"></i>
                  Kembali ke Dashboard
                </Button>
              </Link>
            </Card.Body>
          </Card>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="card-header-alma text-center">
                  <i className="bi bi-person me-2"></i>
                  <span className="fw-bold">Data Pribadi</span>
                </Card.Header>
                <Card.Body className="text-center">
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted text-start">Nama</td>
                        <td className="fw-semibold text-end">{patient.name}</td>
                      </tr>
                      <tr>
                        <td className="text-muted text-start">Umur</td>
                        <td className="text-end">{patient.age} tahun</td>
                      </tr>
                      <tr>
                        <td className="text-muted text-start">Nama Suami</td>
                        <td className="text-end">{patient.husbandName || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted text-start">No. HP</td>
                        <td className="text-end">{patient.phoneNumber}</td>
                      </tr>
                      <tr>
                        <td className="text-muted text-start">Alamat</td>
                        <td className="text-end">{patient.address}</td>
                      </tr>
                    </tbody>
                  </table>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="card-header-alma-pink text-center">
                  <i className="bi bi-heart-pulse me-2"></i>
                  <span className="fw-bold">Data Kehamilan</span>
                </Card.Header>
                <Card.Body className="text-center">
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted text-start">Usia Kehamilan</td>
                        <td className="text-end">
                          <Badge bg="primary" className="badge-alma">{calculateGestationalAge(patient.lastMenstrualPeriod)} minggu</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted text-start">Kehamilan Ke</td>
                        <td className="text-end">{patient.pregnancyOrder}x</td>
                      </tr>
                      <tr>
                        <td className="text-muted text-start">Riwayat Keguguran</td>
                        <td className="text-end">
                          {patient.hasMiscarriage ? (
                            <Badge bg="warning" className="badge-alma">Ya ({patient.miscarriageCount || 0})</Badge>
                          ) : (
                            <span className="text-success">Tidak</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted text-start">HPHT</td>
                        <td className="text-end">
                          {new Date(patient.lastMenstrualPeriod).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted text-start">HPL</td>
                        <td className="text-end">
                          {new Date(patient.estimatedDueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted text-start">HB Terakhir</td>
                        <td className="text-end">
                          {(() => {
                            const status = getHemoglobinStatus(patient.lastHemoglobin);
                            return (
                              <Badge bg={status.variant} className="badge-alma">
                                {patient.lastHemoglobin} g/dL ({status.text})
                              </Badge>
                            );
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm">
            <Card.Header className="card-header-alma text-center">
              <i className="bi bi-clipboard2-check me-2"></i>
              <span className="fw-bold">Riwayat Daily Check</span>
            </Card.Header>
            <Card.Body>
              <DailyCheckHistory patientId={patient.id} refreshTrigger={0} />
            </Card.Body>
          </Card>
        </Container>
      </div>
    </Layout>
  );
};

export default PatientDetailPage;