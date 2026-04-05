// components/RegisterMidwifeForm.tsx
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
}

const RegisterMidwifeForm = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

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

    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleBack = () => {
    router.push('/midwife/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    if (!session || session.user.role !== 'MIDWIFE') {
      setError('Unauthorized: Only midwives can register other midwives.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register-bidan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register midwife');
      }

      setSuccess('Bidan berhasil didaftarkan!');
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
      });
      setTimeout(() => {
        router.push('/midwife/dashboard');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftarkan bidan.');
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
              Pendaftaran Akun Bidan Baru
            </h4>
            <p className="text-muted mb-0 small">Daftarkan akun bidan baru untuk dapat akses sistem</p>
          </div>
          <Button variant="secondary" onClick={handleBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Kembali
          </Button>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="card-header-alma">
            <i className="bi bi-shield-plus fs-4"></i>
            <div>
              <h5 className="mb-0 fw-bold">Formulir Pendaftaran Bidan</h5>
              <small className="text-white-50">Isi data dengan benar</small>
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
              <Row className="justify-content-center">
                <Col md={8} lg={6}>
                  <div style={{ backgroundColor: '#FCE4EC', borderRadius: '10px' }} className="p-4">
                    <h6 className="fw-bold mb-4 text-alma-green">
                      <i className="bi bi-person-badge me-2"></i>
                      Data Akun Bidan
                    </h6>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium small">Nama Lengkap Bidan</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                          <i className="bi bi-person" style={{ color: '#E91E63' }}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="name"
                          placeholder="Masukkan nama lengkap bidan"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          minLength={2}
                          style={{ border: '2px solid #E0E0E0' }}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted small">Minimal 2 karakter</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium small">Username</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                          <i className="bi bi-at" style={{ color: '#E91E63' }}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="username"
                          placeholder="Username untuk login"
                          value={formData.username}
                          onChange={handleChange}
                          required
                          minLength={4}
                          pattern="^[a-zA-Z0-9_]+$"
                          style={{ border: '2px solid #E0E0E0' }}
                        />
                      </InputGroup>
                      <Form.Text className="text-muted small">Hanya huruf, angka, dan underscore. Minimal 4 karakter</Form.Text>
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
                          placeholder="Password untuk login"
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
                      <Form.Text className="text-muted small">Minimal 8 karakter dengan huruf besar, kecil, dan angka</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium small">Konfirmasi Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                          <i className="bi bi-lock-fill" style={{ color: '#E91E63' }}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          placeholder="Masukkan kembali password"
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

                    <div className="d-flex justify-content-end gap-2">
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
                            Daftarkan Bidan
                          </>
                        )}
                      </Button>
                    </div>
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

export default RegisterMidwifeForm;