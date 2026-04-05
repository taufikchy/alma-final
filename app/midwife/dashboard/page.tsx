// app/midwife/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Card, Table, Alert, Spinner, Button, Badge, Modal } from 'react-bootstrap';
import Link from 'next/link';
import { calculateGestationalAge } from '@/lib/gestationalAge';

interface Patient {
  id: string;
  name: string;
  husbandName: string;
  age: number;
  phoneNumber: string;
  address: string;
  lastMenstrualPeriod: string;
  pregnancyOrder: number;
  hasMiscarriage: boolean;
  miscarriageCount?: number;
  estimatedDueDate: string;
  lastHemoglobin: number;
}

const getHbClassification = (hb: number) => {
  if (hb >= 11) {
    return { text: 'Normal', variant: 'success' };
  } else if (hb >= 9 && hb <= 10.9) {
    return { text: 'Anemia Ringan', variant: 'warning' };
  } else if (hb >= 7 && hb <= 8.9) {
    return { text: 'Anemia Sedang', variant: 'danger' };
  } else {
    return { text: 'Anemia Berat', variant: 'danger' };
  }
};

const MidwifeDashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingPatients, setPendingPatients] = useState<{ id: string; name: string; phoneNumber: string; address: string; lastMenstrualPeriod: string }[]>([]);
  const [showPendingList, setShowPendingList] = useState(true);

  useEffect(() => {
    const fetchPendingPatients = async () => {
      if (status === 'authenticated' && session?.user && session.user.role === 'MIDWIFE') {
        try {
          const response = await fetch('/api/midwife/pending-checks', { credentials: 'include' });
          if (response.ok) {
            const data = await response.json();
            setPendingPatients(data);
          }
        } catch (err) {
          console.error('Error fetching pending patients:', err);
        }
      }
    };

    fetchPendingPatients();
    const interval = setInterval(fetchPendingPatients, 60000);

    return () => clearInterval(interval);
  }, [session, status]);

  useEffect(() => {
    const fetchPatients = async () => {
      if (status === 'authenticated' && session?.user && session.user.role === 'MIDWIFE') {
        try {
          const response = await fetch('/api/patients', { credentials: 'include' });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch patients');
          }
          const data: Patient[] = await response.json();
          setPatients(data);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    fetchPatients();
  }, [session, status, router]);

  const handleShowDetail = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/patients/${patientToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete patient');
      }

      setPatients(patients.filter(p => p.id !== patientToDelete.id));
      setShowDeleteModal(false);
      setPatientToDelete(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus pasien');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPatientToDelete(null);
  };

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

  if (!session || !session.user || session.user.role !== 'MIDWIFE') {
    return null;
  }

  return (
    <Layout>
      <div style={{ backgroundColor: '#FFF5F8', minHeight: '100vh' }} className="py-4">
        <Container>
          {pendingPatients.length > 0 && (
            <Card className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px', borderLeft: '6px solid #FFC107' }}>
              <Card.Header
                className="bg-warning py-3 d-flex align-items-center justify-content-between"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowPendingList(!showPendingList)}
              >
                <div className="d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                  <strong className="fs-5">PERHATIAN: {pendingPatients.length} pasien belum daily check hari ini</strong>
                </div>
                <div>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPendingList(!showPendingList);
                    }}
                    className="d-flex align-items-center gap-1"
                  >
                    {showPendingList ? (
                      <>
                        <span>Tutup</span>
                        <i className="bi bi-chevron-up"></i>
                      </>
                    ) : (
                      <>
                        <span>Lihat</span>
                        <i className="bi bi-chevron-down"></i>
                      </>
                    )}
                  </Button>
                </div>
              </Card.Header>
              {showPendingList && (
                <Card.Body className="p-0">
                  <div className="list-group list-group-flush">
                    {pendingPatients.slice(0, 5).map((patient) => {
                      const cleanNumber = patient.phoneNumber.replace(/\D/g, '').replace(/^0/, '62');
                      
                      // JURUS PAMUNGKAS: Merakit emoji dari kode matematika murni (Hex)
                      // Ini 1000% kebal dari error format file ANSI/Windows
                      const waveEmoji = String.fromCodePoint(0x1F44B, 0x1F3FB); // 👋🏻
                      const heartEmoji = String.fromCodePoint(0x1F495); // 💕
                      
                      const pesanWA = `Halo Bunda, jangan lupa untuk melakukan daily check hari ini ya!`;
                      
                      return (
                        <div key={patient.id} className="list-group-item d-flex align-items-center justify-content-between py-3 px-4">
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
                              {patient.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bold text-alma-green">{patient.name}</div>
                              <small className="text-muted">
                                <i className="bi bi-telephone me-1"></i>
                                {patient.phoneNumber} • Hamil {calculateGestationalAge(patient.lastMenstrualPeriod)} minggu
                              </small>
                            </div>
                          </div>
                          <Button
                            variant="success"
                            size="sm"
                            // Kita bungkus pakai encodeURIComponent dengan aman
                            href={`https://wa.me/${cleanNumber}?text=${encodeURIComponent(pesanWA)}`}
                            target="_blank"
                            className="fw-bold"
                          >
                            <i className="bi bi-whatsapp me-2"></i>
                            Hubungi
                          </Button>
                        </div>
                      );
                    })}
                    {pendingPatients.length > 5 && (
                      <div className="list-group-item text-center text-muted py-3">
                        <i className="bi bi-three-dots me-2"></i>
                        ...dan {pendingPatients.length - 5} pasien lainnya
                      </div>
                    )}
                  </div>
                </Card.Body>
              )}
            </Card>
          )}
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <Card.Body className="py-3 px-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1 fw-bold text-alma-green">
                    <i className="bi bi-clipboard2-pulse me-2"></i>
                    Dashboard Bidan
                  </h4>
                  <p className="text-muted mb-0 small">Kelola data ibu hamil terdaftar</p>
                </div>
                <Link href="/midwife/register-patient">
                  <Button className="btn-alma-primary text-center">
                    <i className="bi bi-person-plus me-2"></i>
                    Daftarkan Pasien Baru
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-header-alma">
              <i className="bi bi-people-fill fs-4"></i>
              <div>
                <h5 className="mb-0 fw-bold">Daftar Ibu Hamil Terdaftar</h5>
                <small className="text-white-50">Total: {patients.length} pasien</small>
              </div>
            </div>
            <Card.Body className="p-4">
              {error && (
                <Alert variant="danger" className="m-3 rounded-3 text-center">{error}</Alert>
              )}
              {patients.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-inbox"></i>
                  <p className="text-muted mt-2">Belum ada ibu hamil yang terdaftar</p>
                  <Link href="/midwife/register-patient">
                    <Button variant="success" size="sm" className="text-center">
                      <i className="bi bi-plus-circle me-2"></i>
                      Daftarkan Sekarang
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table bordered hover className="mb-0 align-middle table-alma" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th className="text-center">No</th>
                        <th className="text-center">Nama</th>
                        <th className="text-center">Kontak</th>
                        <th className="text-center">Alamat</th>
                        <th className="text-center">Umur</th>
                        <th className="text-center">Nama Suami</th>
                        <th className="text-center">HPHT</th>
                        <th className="text-center">HPL</th>
                        <th className="text-center">Usia Kehamilan</th>
                        <th className="text-center">Kehamilan Ke</th>
                        <th className="text-center">HB</th>
                        <th className="text-center">Keguguran</th>
                        <th className="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((patient, index) => {
                        return (
                          <tr key={patient.id}>
                            <td className="text-center">{index + 1}</td>
                            <td className="text-start fw-semibold text-alma-green">{patient.name}</td>
                            <td className="text-start">{patient.phoneNumber}</td>
                            <td className="text-start">{patient.address}</td>
                            <td className="text-center">{patient.age}</td>
                            <td className="text-start">{patient.husbandName || '-'}</td>
                            <td className="text-center">
                              {new Date(patient.lastMenstrualPeriod).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="text-center">
                              {new Date(patient.estimatedDueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="text-center">
                              <Badge bg="primary" className="badge-alma">{calculateGestationalAge(patient.lastMenstrualPeriod)} mg</Badge>
                            </td>
                            <td className="text-center">{patient.pregnancyOrder}x</td>
                            <td className="text-center">
                              <Badge bg={getHbClassification(patient.lastHemoglobin).variant}>
                                {patient.lastHemoglobin} g/dL ({getHbClassification(patient.lastHemoglobin).text})
                              </Badge>
                            </td>
                            <td className="text-center">
                              {patient.hasMiscarriage ? (
                                <Badge bg="warning" className="badge-alma">Ya ({patient.miscarriageCount || 0})</Badge>
                              ) : (
                                <span className="text-success">-</span>
                              )}
                            </td>
                            <td className="text-center">
                              <div className="d-flex justify-content-center gap-1">
                                <Link href={`/midwife/patients/${patient.id}`}>
                                  <Button variant="info" size="sm" className="text-center">
                                    <i className="bi bi-eye"></i>
                                  </Button>
                                </Link>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleShowDetail(patient)}
                                  className="text-center"
                                >
                                  <i className="bi bi-clipboard-plus"></i>
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDeleteClick(patient)}
                                  className="text-center"
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="bg-alma-pink-dark text-white">
          <Modal.Title className="fw-bold">
            <i className="bi bi-person-badge me-2"></i>
            Detail Pasien: {selectedPatient?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPatient && (
            <div className="row g-3">
              <div className="col-md-6">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Header className="bg-alma-green text-white text-center fw-bold">
                    <i className="bi bi-person me-2"></i>Data Ibu
                  </Card.Header>
                  <Card.Body className="text-center">
                    <table className="table table-sm mb-0">
                      <tbody>
                        <tr>
                          <td className="text-muted text-start">Nama</td>
                          <td className="fw-semibold text-end">{selectedPatient.name}</td>
                        </tr>
                        <tr>
                          <td className="text-muted text-start">Umur</td>
                          <td className="text-end">{selectedPatient.age} tahun</td>
                        </tr>
                        <tr>
                          <td className="text-muted text-start">No. HP</td>
                          <td className="text-end">{selectedPatient.phoneNumber}</td>
                        </tr>
                        <tr>
                          <td className="text-muted text-start">Alamat</td>
                          <td className="text-end">{selectedPatient.address}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </div>
              <div className="col-md-6">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Header className="bg-alma-pink-dark text-white text-center fw-bold">
                    <i className="bi bi-heart-pulse me-2"></i>Data Kehamilan
                  </Card.Header>
                  <Card.Body className="text-center">
                    <table className="table table-sm mb-0">
                      <tbody>
                        <tr>
                          <td className="text-muted text-start">Nama Suami</td>
                          <td className="text-end">{selectedPatient.husbandName || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted text-start">Kehamilan ke</td>
                          <td className="text-end">{selectedPatient.pregnancyOrder}x</td>
                        </tr>
                        <tr>
                          <td className="text-muted text-start">Riwayat Keguguran</td>
                          <td className="text-end">
                            {selectedPatient.hasMiscarriage ? `Ya (${selectedPatient.miscarriageCount || 0} kali)` : 'Tidak'}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-muted text-start">Hemoglobin</td>
                          <td className="text-end">
                            {(() => {
                              const classification = getHbClassification(selectedPatient.lastHemoglobin);
                              return (
                                <Badge bg={classification.variant} className="badge-alma">
                                  {selectedPatient.lastHemoglobin} g/dL ({classification.text})
                                </Badge>
                              );
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Link href={`/midwife/patients/${selectedPatient?.id}`}>
            <Button className="btn-alma-primary text-center">
              <i className="bi bi-eye me-2"></i>
              Lihat Detail Lengkap
            </Button>
          </Link>
          <Button variant="secondary" onClick={handleCloseModal} className="text-center">
            <i className="bi bi-x-circle me-2"></i>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={handleCancelDelete} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="fw-bold">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Konfirmasi Hapus Pasien
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <i className="bi bi-person-x fs-1 text-danger mb-3 d-block"></i>
            <p className="mb-2">Apakah Anda yakin ingin menghapus pasien:</p>
            <h5 className="fw-bold text-danger">{patientToDelete?.name}</h5>
            <p className="text-muted small mt-3">
              <i className="bi bi-info-circle me-1"></i>
              Tindakan ini tidak dapat dibatalkan. Semua data daily check pasien juga akan dihapus.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="secondary" onClick={handleCancelDelete} disabled={deleting}>
            <i className="bi bi-x-circle me-2"></i>
            Batal
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Menghapus...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Hapus Pasien
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};

export default MidwifeDashboardPage;