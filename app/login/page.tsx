// app/login/page.tsx
"use client";

import { useState } from 'react';
import Layout from '@/components/Layout';
import { Form, Button, Alert, Card, InputGroup } from 'react-bootstrap';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SUPER_ADMIN');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await signIn('credentials', {
      redirect: false,
      username,
      password,
      role,
    });

    if (result?.error) {
      setError('Login gagal. Periksa username, password, dan peran Anda.');
    } else {
      if (role === 'MIDWIFE') {
        router.push('/midwife/dashboard');
      } else if (role === 'PATIENT') {
        router.push('/patient/dashboard');
      } else if (role === 'SUPER_ADMIN') {
        router.push('/superadmin/dashboard');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <Layout>
      <div className="bg-white min-vh-100 py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-5 col-lg-4">
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <h3 className="fw-bold text-alma-green mb-1">
                      <img src="/logo.png" alt="ALMA Logo" style={{ height: '40px', marginRight: '8px' }} /> ALMA
                    </h3>
                    <p className="text-muted small mb-0">Masuk ke Akun Anda</p>
                  </div>

                  <hr className="my-3" />

                  {error && (
                    <Alert variant="danger" className="py-2 mb-3 text-center">
                      <i className="bi bi-exclamation-circle-fill me-2"></i>
                      {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium small d-block text-center mb-2">Username</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-alma-pink border-0">
                          <i className="bi bi-person-fill fs-5 text-alma-pink"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Masukkan username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          className="border-start-0"
                        />
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium small d-block text-center mb-2">Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-alma-pink border-0">
                          <i className="bi bi-lock-fill fs-5 text-alma-pink"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Masukkan password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="border-start-0"
                        />
                        <Button
                          variant="light"
                          onClick={() => setShowPassword(!showPassword)}
                          className="border-start-0 border-end-0"
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </Button>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium small d-block text-center mb-2">Masuk sebagai:</Form.Label>
                      <div className="d-flex justify-content-center gap-3">
                        <Form.Check
                          type="radio"
                          label={
                            <span className="d-flex align-items-center gap-2">
                              <i className="bi bi-person-fill text-alma-pink"></i>
                              Pasien
                            </span>
                          }
                          name="roleOptions"
                          id="rolePatient"
                          value="PATIENT"
                          checked={role === 'PATIENT'}
                          onChange={(e) => setRole(e.target.value)}
                        />
                        <Form.Check
                          type="radio"
                          label={
                            <span className="d-flex align-items-center gap-2">
                              <i className="bi bi-clipboard2-pulse-fill text-alma-green"></i>
                              Bidan
                            </span>
                          }
                          name="roleOptions"
                          id="roleMidwife"
                          value="MIDWIFE"
                          checked={role === 'MIDWIFE'}
                          onChange={(e) => setRole(e.target.value)}
                        />
                      </div>
                    </Form.Group>

                    <Button
                      variant="success"
                      type="submit"
                      className="btn-alma-primary w-100 py-2"
                    >
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Masuk
                    </Button>

                    <div className="text-center mt-3">
                      <small className="text-muted">
                        Lupa password?
                        <a href="#" className="text-alma-green text-decoration-none fw-medium ms-1">
                          Reset di sini
                        </a>
                      </small>
                    </div>
                  </Form>
                </Card.Body>
              </Card>

              <p className="text-center text-muted small mt-4">
                <i className="bi bi-heart-pulse-fill text-alma-pink me-1"></i>
                ALMA - Alarm Lawan Anemia
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;