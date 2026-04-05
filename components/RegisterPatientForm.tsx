// components/RegisterPatientForm.tsx
"use client";

import { useState } from 'react';
import { Form, Button, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  husbandName: string;
  age: string;
  phoneNumber: string;
  address: string;
  pregnancyOrder: string;
  hasMiscarriage: boolean;
  miscarriageCount: string;
  lastMenstrualPeriod: string;
  estimatedDueDate: string;
  lastHemoglobin: string;
}

const initialFormData: FormData = {
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  husbandName: '',
  age: '',
  phoneNumber: '',
  address: '',
  pregnancyOrder: '',
  hasMiscarriage: false,
  miscarriageCount: '',
  lastMenstrualPeriod: '',
  estimatedDueDate: '',
  lastHemoglobin: '',
};

const RegisterPatientForm = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    if (formData.name.trim().length < 2) {
      setError('Nama lengkap minimal 2 karakter');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username hanya boleh mengandung huruf, angka, dan underscore');
      return false;
    }

    if (formData.username.length < 4) {
      setError('Username minimal 4 karakter');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password minimal 8 karakter');
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('Password harus mengandung minimal 1 huruf besar, 1 huruf kecil, dan 1 angka');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return false;
    }

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 10 || age > 60) {
      setError('Umur harus antara 10-60 tahun');
      return false;
    }

    if (!/^\d+$/.test(formData.phoneNumber)) {
      setError('Nomor HP hanya boleh mengandung angka');
      return false;
    }

    if (formData.phoneNumber.length < 10 || formData.phoneNumber.length > 15) {
      setError('Nomor HP harus antara 10-15 digit');
      return false;
    }

    const pregnancyOrder = parseInt(formData.pregnancyOrder);
    if (isNaN(pregnancyOrder) || pregnancyOrder < 1 || pregnancyOrder > 20) {
      setError('Kehamilan ke harus antara 1-20');
      return false;
    }

    if (!formData.lastMenstrualPeriod) {
      setError('HPHT harus diisi');
      return false;
    }

    if (!formData.estimatedDueDate) {
      setError('HPL harus diisi');
      return false;
    }

    const hb = parseFloat(formData.lastHemoglobin);
    if (isNaN(hb) || hb < 5 || hb > 20) {
      setError('Hemoglobin harus antara 5-20 g/dL');
      return false;
    }

    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBack = () => {
    router.push('/midwife/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    if (!session || session.user.role !== 'MIDWIFE') {
      setError('Unauthorized: Only midwives can register patients.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register patient');
      }

      setSuccess('Pasien berhasil didaftarkan!');
      setFormData(initialFormData);
      setTimeout(() => {
        router.push('/midwife/dashboard');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftarkan pasien.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#FFF5F8', minHeight: '100vh' }} className="py-4">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h4 className="mb-1 fw-bold text-alma-green">
              <i className="bi bi-person-plus me-2"></i>
              Pendaftaran Pasien Baru
            </h4>
            <p className="text-muted mb-0 small">Isi form di bawah untuk mendaftarkan ibu hamil baru</p>
          </div>
          <Button variant="secondary" onClick={handleBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Kembali
          </Button>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="card-header-alma">
            <i className="bi bi-clipboard2-pulse fs-4"></i>
            <div>
              <h5 className="mb-0 fw-bold">Formulir Pendaftaran Ibu Hamil</h5>
              <small className="text-white-50">Pastikan semua data diisi dengan benar</small>
            </div>
          </div>

          <div className="p-4">
            {error && (
              <Alert variant="danger" className="mb-4">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" className="mb-4">
                <i className="bi bi-check-circle-fill me-2"></i>
                {success}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Row className="g-4">
                <Col lg={4}>
                  <div style={{ backgroundColor: '#FCE4EC', borderRadius: '10px' }} className="p-3 h-100">
                    <h6 className="fw-bold mb-3 text-alma-green">
                      <i className="bi bi-person-badge me-2"></i>
                      Akun Pasien
                    </h6>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium small">Username</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                          <i className="bi bi-at" style={{ color: '#E91E63' }}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="username"
                          placeholder="Username"
                          value={formData.username}
                          onChange={handleChange}
                          required
                          minLength={4}
                          pattern="^[a-zA-Z0-9_]+$"
                          style={{ border: '2px solid #E0E0E0' }}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted small">Hanya huruf, angka, underscore</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium small">Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                          <i className="bi bi-lock" style={{ color: '#E91E63' }}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleChange}
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
                          <i className="bi bi-lock-fill" style={{ color: '#E91E63' }}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          placeholder="Ulangi password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
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

                <Col lg={8}>
                  <div style={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '10px' }} className="p-3">
                    <h6 className="fw-bold mb-3 text-alma-pink">
                      <i className="bi bi-heart-pulse me-2"></i>
                      Data Diri Ibu Hamil
                    </h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium small">Nama Lengkap</Form.Label>
                          <InputGroup>
                            <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                              <i className="bi bi-person" style={{ color: '#E91E63' }}></i>
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              name="name"
                              placeholder="Nama ibu hamil"
                              value={formData.name}
                              onChange={handleChange}
                              required
                              minLength={2}
                              style={{ border: '2px solid #E0E0E0' }}
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium small">Nama Suami</Form.Label>
                          <InputGroup>
                            <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                              <i className="bi bi-person-hearts" style={{ color: '#E91E63' }}></i>
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              name="husbandName"
                              placeholder="Nama suami"
                              value={formData.husbandName}
                              onChange={handleChange}
                              style={{ border: '2px solid #E0E0E0' }}
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium small">Umur</Form.Label>
                          <Form.Control
                            type="number"
                            name="age"
                            placeholder="Umur ibu"
                            value={formData.age}
                            onChange={handleChange}
                            required
                            min={10}
                            max={60}
                            style={{ border: '2px solid #E0E0E0' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium small">No. HP</Form.Label>
                          <Form.Control
                            type="text"
                            name="phoneNumber"
                            placeholder="08xxxxxxxxxx"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                            pattern="\d{10,15}"
                            minLength={10}
                            maxLength={15}
                            style={{ border: '2px solid #E0E0E0' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="fw-medium small">Alamat</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            name="address"
                            placeholder="Alamat lengkap"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            style={{ border: '2px solid #E0E0E0' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>

              <Row className="g-4 mt-3">
                <Col lg={6}>
                  <div style={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '10px' }} className="p-3">
                    <h6 className="fw-bold mb-3 text-alma-green">
                      <i className="bi bi-baby me-2"></i>
                      Data Kehamilan
                    </h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium small">Kehamilan Ke-</Form.Label>
                          <Form.Control
                            type="number"
                            name="pregnancyOrder"
                            placeholder="Contoh: 2"
                            value={formData.pregnancyOrder}
                            onChange={handleChange}
                            required
                            min={1}
                            max={20}
                            style={{ border: '2px solid #E0E0E0' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Check
                          type="checkbox"
                          label="Pernah keguguran?"
                          name="hasMiscarriage"
                          checked={formData.hasMiscarriage}
                          onChange={handleChange}
                        />
                        {formData.hasMiscarriage && (
                          <Form.Group className="mt-2">
                            <Form.Label className="fw-medium small">Jumlah Keguguran</Form.Label>
                            <Form.Control
                              type="number"
                              name="miscarriageCount"
                              placeholder="Jumlah"
                              value={formData.miscarriageCount}
                              onChange={handleChange}
                              min={1}
                              max={20}
                              style={{ border: '2px solid #E0E0E0' }}
                            />
                          </Form.Group>
                        )}
                      </Col>
                    </Row>
                  </div>
                </Col>

                <Col lg={6}>
                  <div style={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '10px' }} className="p-3">
                    <h6 className="fw-bold mb-3 text-alma-green">
                      <i className="bi bi-calendar2-week me-2"></i>
                      Tanggal Penting
                    </h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium small">HPHT <small className="text-muted">(Hari Pertama Haid Terakhir)</small></Form.Label>
                          <Form.Control
                            type="date"
                            name="lastMenstrualPeriod"
                            value={formData.lastMenstrualPeriod}
                            onChange={handleChange}
                            required
                            style={{ border: '2px solid #E0E0E0' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium small">HPL <small className="text-muted">(Hari Perkiraan Lahir)</small></Form.Label>
                          <Form.Control
                            type="date"
                            name="estimatedDueDate"
                            value={formData.estimatedDueDate}
                            onChange={handleChange}
                            required
                            style={{ border: '2px solid #E0E0E0' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="fw-medium small">Hemoglobin (HB) Terakhir</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.1"
                            name="lastHemoglobin"
                            placeholder="Contoh: 11.5"
                            value={formData.lastHemoglobin}
                            onChange={handleChange}
                            required
                            min={5}
                            max={20}
                            style={{ border: '2px solid #E0E0E0' }}
                          />
                          <Form.Text className="text-muted small">Satuan: g/dL (normal: 11-16)</Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Col>

                <Col lg={12}>
                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <Button
                      variant="outline-secondary"
                      onClick={handleBack}
                      className="px-4"
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="btn-alma-primary px-5"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Mendaftarkan...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Daftarkan Pasien
                        </>
                      )}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPatientForm;