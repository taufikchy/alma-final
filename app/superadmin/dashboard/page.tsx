// app/superadmin/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Table, Badge, Spinner, Alert, Button, Modal, Form, InputGroup } from 'react-bootstrap';
import Link from 'next/link';
import { calculateGestationalAge } from '@/lib/gestationalAge';

interface MidwifeEntry {
  id: string;
  userId: string;
  name: string;
  username: string;
  role: string;
  patientCount: number;
  createdAt: string;
}

interface PatientEntry {
  id: string;
  name: string;
  husbandName: string;
  age: number;
  lastMenstrualPeriod: string;
  phoneNumber: string;
  address: string;
  estimatedDueDate: string;
  lastHemoglobin: number;
}

interface NewBidanForm {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
}

const SuperAdminDashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [midwives, setMidwives] = useState<MidwifeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<NewBidanForm>({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPatientsModal, setShowPatientsModal] = useState(false);
  const [selectedMidwife, setSelectedMidwife] = useState<MidwifeEntry | null>(null);
  const [patients, setPatients] = useState<PatientEntry[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const fetchMidwives = async () => {
    try {
      const response = await fetch('/api/midwives', { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch midwives');
      }
      const data: MidwifeEntry[] = await response.json();
      setMidwives(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN') {
      fetchMidwives();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  const handleOpenAddModal = () => {
    setFormData({ username: '', password: '', confirmPassword: '', name: '' });
    setSubmitError(null);
    setSubmitSuccess(null);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleViewPatients = async (midwife: MidwifeEntry) => {
    setSelectedMidwife(midwife);
    setShowPatientsModal(true);
    setLoadingPatients(true);
    setPatients([]);
    try {
      const response = await fetch(`/api/patients?midwifeId=${midwife.id}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      const data = await response.json();
      setPatients(data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleClosePatientsModal = () => {
    setShowPatientsModal(false);
    setSelectedMidwife(null);
    setPatients([]);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (formData.name.trim().length < 2) {
      setSubmitError('Nama lengkap minimal 2 karakter');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setSubmitError('Username hanya boleh mengandung huruf, angka, dan underscore');
      return false;
    }
    if (formData.username.length < 4) {
      setSubmitError('Username minimal 4 karakter');
      return false;
    }
    if (formData.password.length < 8) {
      setSubmitError('Password minimal 8 karakter');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setSubmitError('Password harus mengandung minimal 1 huruf besar, 1 huruf kecil, dan 1 angka');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setSubmitError('Password dan konfirmasi password tidak cocok');
      return false;
    }
    return true;
  };

  const handleSubmitBidan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/register-bidan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register bidan');
      }

      setSubmitSuccess('Bidan berhasil didaftarkan!');
      setFormData({ username: '', password: '', confirmPassword: '', name: '' });
      fetchMidwives();
      setTimeout(() => {
        handleCloseAddModal();
      }, 1500);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setSubmitting(false);
    }
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

  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <Layout>
      <div style={{ backgroundColor: '#FFF5F8', minHeight: '100vh' }} className="py-4">
        <Container>
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <Card.Body className="py-3 px-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1 fw-bold text-alma-green">
                    <i className="bi bi-shield-lock me-2"></i>
                    Dashboard Super Admin
                  </h4>
                  <p className="text-muted mb-0 small">Kelola semua bidan dan pasien</p>
                </div>
                <Button className="btn-alma-primary text-center" onClick={handleOpenAddModal}>
                  <i className="bi bi-person-plus me-2"></i>
                  Tambah Bidan Baru
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Row className="mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <i className="bi bi-people-fill fs-1 text-alma-green mb-2 d-block"></i>
                  <h3 className="mb-1 fw-bold">{midwives.length}</h3>
                  <p className="text-muted mb-0">Total Bidan</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <i className="bi bi-person-plus-fill fs-1 text-alma-pink mb-2 d-block"></i>
                  <h3 className="mb-1 fw-bold">{midwives.reduce((sum, m) => sum + m.patientCount, 0)}</h3>
                  <p className="text-muted mb-0">Total Pasien</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center">
                  <i className="bi bi-check-circle-fill fs-1 text-success mb-2 d-block"></i>
                  <h3 className="mb-1 fw-bold">
                    {midwives.filter(m => m.patientCount > 0).length}
                  </h3>
                  <p className="text-muted mb-0">Bidan Aktif</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-header-alma">
              <i className="bi bi-person-badge fs-4"></i>
              <div>
                <h5 className="mb-0 fw-bold">Daftar Semua Bidan</h5>
                <small className="text-white-50">Kelola data bidan terdaftar</small>
              </div>
            </div>
            <Card.Body className="p-4">
              {error && (
                <Alert variant="danger" className="m-3 rounded-3 text-center">{error}</Alert>
              )}
              {midwives.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-inbox"></i>
                  <p className="text-muted mt-2">Belum ada bidan yang terdaftar</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table bordered hover className="mb-0 align-middle table-alma" style={{ fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th className="text-center">No</th>
                        <th className="text-center">Nama Bidan</th>
                        <th className="text-center">Username</th>
                        <th className="text-center">Jumlah Pasien</th>
                        <th className="text-center">Tanggal Daftar</th>
                        <th className="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {midwives.map((midwife, index) => (
                        <tr key={midwife.id}>
                          <td className="text-center">{index + 1}</td>
                          <td className="text-start fw-semibold text-alma-green">{midwife.name}</td>
                          <td className="text-center">{midwife.username}</td>
                          <td className="text-center">
                            <Badge bg={midwife.patientCount > 0 ? 'success' : 'secondary'} className="badge-alma">
                              {midwife.patientCount} pasien
                            </Badge>
                          </td>
                          <td className="text-center">
                            {new Date(midwife.createdAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="text-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewPatients(midwife)}
                              disabled={midwife.patientCount === 0}
                            >
                              <i className="bi bi-eye me-1"></i>
                              Lihat Pasien
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      <Modal show={showAddModal} onHide={handleCloseAddModal} centered size="lg">
        <Modal.Header closeButton className="bg-alma-green text-white">
          <Modal.Title className="fw-bold">
            <i className="bi bi-person-plus me-2"></i>
            Tambah Bidan Baru
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {submitSuccess ? (
            <Alert variant="success" className="text-center">
              <i className="bi bi-check-circle me-2"></i>
              {submitSuccess}
            </Alert>
          ) : (
            <Form onSubmit={handleSubmitBidan}>
              <Row className="g-4">
                <Col lg={6}>
                  <div style={{ backgroundColor: '#E8F5E9', borderRadius: '10px' }} className="p-3 h-100">
                    <h6 className="fw-bold mb-3 text-alma-green">
                      <i className="bi bi-person-badge me-2"></i>
                      Akun Bidan
                    </h6>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium small">Nama Lengkap</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                          <i className="bi bi-person" style={{ color: '#4CAF50' }}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          placeholder="Nama lengkap bidan"
                          required
                          minLength={2}
                          style={{ border: '2px solid #E0E0E0' }}
                        />
                      </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium small">Username</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                          <i className="bi bi-at" style={{ color: '#4CAF50' }}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleFormChange}
                          placeholder="Username"
                          required
                          minLength={4}
                          pattern="^[a-zA-Z0-9_]+$"
                          style={{ border: '2px solid #E0E0E0' }}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted small">Hanya huruf, angka, underscore</Form.Text>
                    </Form.Group>
                  </div>
                </Col>
                <Col lg={6}>
                  <div style={{ backgroundColor: '#FFF3E0', borderRadius: '10px' }} className="p-3 h-100">
                    <h6 className="fw-bold mb-3 text-warning">
                      <i className="bi bi-lock me-2"></i>
                      Kata Sandi
                    </h6>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium small">Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                          <i className="bi bi-lock" style={{ color: '#FF9800' }}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleFormChange}
                          placeholder="Password"
                          required
                          minLength={8}
                          style={{ border: '2px solid #E0E0E0' }}
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ border: '2px solid #E0E0E0', borderLeft: 'none' }}
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </Button>
                      </InputGroup>
                      <Form.Text className="text-muted small">Min 8 karakter</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium small">Konfirmasi Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                          <i className="bi bi-lock-fill" style={{ color: '#FF9800' }}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleFormChange}
                          placeholder="Ulangi password"
                          required
                          minLength={8}
                          style={{ border: '2px solid #E0E0E0' }}
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ border: '2px solid #E0E0E0', borderLeft: 'none' }}
                        >
                          <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </Button>
                      </InputGroup>
                    </Form.Group>
                  </div>
                </Col>
              </Row>
              {submitError && (
                <Alert variant="danger" className="mt-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {submitError}
                </Alert>
              )}
            </Form>
          )}
        </Modal.Body>
        {!submitSuccess && (
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseAddModal} disabled={submitting}>
              Batal
            </Button>
            <Button className="btn-alma-primary" onClick={handleSubmitBidan} disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Simpan
                </>
              )}
            </Button>
          </Modal.Footer>
        )}
      </Modal>

      <Modal show={showPatientsModal} onHide={handleClosePatientsModal} centered size="lg">
        <Modal.Header closeButton className="bg-alma-pink-dark text-white">
          <Modal.Title className="fw-bold">
            <i className="bi bi-people me-2"></i>
            Daftar Pasien - {selectedMidwife?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingPatients ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Memuat data pasien...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-inbox fs-1 text-muted"></i>
              <p className="text-muted mt-2">Belum ada pasien terdaftar</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table bordered hover className="mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th className="text-center">No</th>
                    <th className="text-center">Nama Pasien</th>
                    <th className="text-center">Usia</th>
                    <th className="text-center">Usia Kehamilan</th>
                    <th className="text-center">No. HP</th>
                    <th className="text-center">Hemoglobin</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient, index) => (
                    <tr key={patient.id}>
                      <td className="text-center">{index + 1}</td>
                      <td className="fw-semibold">{patient.name}</td>
                      <td className="text-center">{patient.age} tahun</td>
                      <td className="text-center">{calculateGestationalAge(patient.lastMenstrualPeriod)} minggu</td>
                      <td className="text-center">{patient.phoneNumber}</td>
                      <td className="text-center">
                        <Badge bg={patient.lastHemoglobin < 11 ? 'danger' : 'success'}>
                          {patient.lastHemoglobin} g/dL
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClosePatientsModal}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};

export default SuperAdminDashboardPage;