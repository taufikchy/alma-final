// components/EditPatientForm.tsx
"use client";

import { useState } from 'react';
import { Form, Button, Alert, Row, Col, InputGroup, Spinner } from 'react-bootstrap';

interface PatientData {
  id: string;
  name: string;
  husbandName: string;
  age: number;
  phoneNumber: string;
  address: string;
  pregnancyOrder: number;
  hasMiscarriage: boolean;
  miscarriageCount: number;
  lastMenstrualPeriod: string;
  estimatedDueDate: string;
  lastHemoglobin: number;
}

interface FormData {
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

const EditPatientForm = ({ patient, onSuccess, onCancel }: { patient: PatientData; onSuccess: () => void; onCancel: () => void }) => {
  const [formData, setFormData] = useState<FormData>({
    name: patient.name,
    husbandName: patient.husbandName,
    age: patient.age.toString(),
    phoneNumber: patient.phoneNumber,
    address: patient.address,
    pregnancyOrder: patient.pregnancyOrder.toString(),
    hasMiscarriage: patient.hasMiscarriage,
    miscarriageCount: patient.miscarriageCount?.toString() || '0',
    lastMenstrualPeriod: patient.lastMenstrualPeriod.split('T')[0],
    estimatedDueDate: patient.estimatedDueDate.split('T')[0],
    lastHemoglobin: patient.lastHemoglobin.toString(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (formData.name.trim().length < 2) {
      setError('Nama lengkap minimal 2 karakter');
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          husbandName: formData.husbandName,
          age: parseInt(formData.age),
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          pregnancyOrder: parseInt(formData.pregnancyOrder),
          hasMiscarriage: formData.hasMiscarriage,
          miscarriageCount: parseInt(formData.miscarriageCount) || 0,
          lastMenstrualPeriod: formData.lastMenstrualPeriod,
          estimatedDueDate: formData.estimatedDueDate,
          lastHemoglobin: parseFloat(formData.lastHemoglobin),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update patient');
      }

      setSuccess('Data pasien berhasil diperbarui!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memperbarui pasien.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="mb-1 fw-bold text-alma-green">
            <i className="bi bi-pencil-square me-2"></i>
            Edit Data Pasien
          </h4>
          <p className="text-muted mb-0 small">Perbarui data ibu hamil dengan benar</p>
        </div>
        <Button variant="secondary" onClick={onCancel}>
          <i className="bi bi-arrow-left me-2"></i>
          Kembali
        </Button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div className="card-header-alma">
          <i className="bi bi-clipboard2-pulse fs-4"></i>
          <div>
            <h5 className="mb-0 fw-bold">Formulir Edit Data Ibu Hamil</h5>
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
              <Col lg={6}>
                <div style={{ backgroundColor: '#FCE4EC', borderRadius: '10px' }} className="p-3 h-100">
                  <h6 className="fw-bold mb-3 text-alma-green">
                    <i className="bi bi-person-badge me-2"></i>
                    Data Pasien
                  </h6>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium small">Nama Lengkap</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                        <i className="bi bi-person" style={{ color: '#E91E63' }}></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="name"
                        placeholder="Nama lengkap"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        minLength={2}
                        style={{ border: '2px solid #E0E0E0' }}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium small">Nama Suami</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                        <i className="bi bi-people" style={{ color: '#E91E63' }}></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="husbandName"
                        placeholder="Nama suami"
                        value={formData.husbandName}
                        onChange={handleChange}
                        required
                        style={{ border: '2px solid #E0E0E0' }}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium small">Umur</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                        <i className="bi bi-calendar" style={{ color: '#E91E63' }}></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="number"
                        name="age"
                        placeholder="Umur"
                        value={formData.age}
                        onChange={handleChange}
                        required
                        min="10"
                        max="60"
                        style={{ border: '2px solid #E0E0E0' }}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium small">Nomor HP</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                        <i className="bi bi-telephone" style={{ color: '#E91E63' }}></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="tel"
                        name="phoneNumber"
                        placeholder="08xxxxxxxxxx"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                        pattern="[0-9]{10,15}"
                        style={{ border: '2px solid #E0E0E0' }}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium small">Alamat</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="address"
                      placeholder="Alamat lengkap"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows={2}
                      style={{ border: '2px solid #E0E0E0' }}
                    />
                  </Form.Group>
                </div>
              </Col>

              <Col lg={6}>
                <div style={{ backgroundColor: '#E8F5E9', borderRadius: '10px' }} className="p-3 h-100">
                  <h6 className="fw-bold mb-3 text-alma-green">
                    <i className="bi bi-heart-pulse me-2"></i>
                    Data Kehamilan
                  </h6>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium small">Kehamilan ke-</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                        <i className="bi bi-1-circle" style={{ color: '#4CAF50' }}></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="number"
                        name="pregnancyOrder"
                        placeholder="Kehamilan ke"
                        value={formData.pregnancyOrder}
                        onChange={handleChange}
                        required
                        min="1"
                        max="20"
                        style={{ border: '2px solid #E0E0E0' }}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium small">Riwayat Keguguran</Form.Label>
                    <div className="mt-2">
                      <Form.Check
                        type="switch"
                        id="hasMiscarriage"
                        name="hasMiscarriage"
                        label="Pernah mengalami keguguran"
                        checked={formData.hasMiscarriage}
                        onChange={handleChange}
                        className="fw-medium"
                      />
                    </div>
                    {formData.hasMiscarriage && (
                      <InputGroup className="mt-2">
                        <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                          <i className="bi bi-x-circle" style={{ color: '#4CAF50' }}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="number"
                          name="miscarriageCount"
                          placeholder="Jumlah keguguran"
                          value={formData.miscarriageCount}
                          onChange={handleChange}
                          min="1"
                          max="20"
                          style={{ border: '2px solid #E0E0E0' }}
                        />
                      </InputGroup>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium small">HPHT (Hari Pertama Haid Terakhir)</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                        <i className="bi bi-calendar-event" style={{ color: '#4CAF50' }}></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="date"
                        name="lastMenstrualPeriod"
                        value={formData.lastMenstrualPeriod}
                        onChange={handleChange}
                        required
                        style={{ border: '2px solid #E0E0E0' }}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium small">HPL (Hari Perkiraan Lahir)</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                        <i className="bi bi-calendar-check" style={{ color: '#4CAF50' }}></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="date"
                        name="estimatedDueDate"
                        value={formData.estimatedDueDate}
                        onChange={handleChange}
                        required
                        style={{ border: '2px solid #E0E0E0' }}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium small">Hemoglobin (Hb) Terakhir (g/dL)</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-white" style={{ border: '2px solid #E0E0E0' }}>
                        <i className="bi bi-droplet" style={{ color: '#4CAF50' }}></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="number"
                        name="lastHemoglobin"
                        placeholder="Contoh: 11.5"
                        value={formData.lastHemoglobin}
                        onChange={handleChange}
                        required
                        min="5"
                        max="20"
                        step="0.1"
                        style={{ border: '2px solid #E0E0E0' }}
                      />
                    </InputGroup>
                  </Form.Group>
                </div>
              </Col>

              <Col xs={12}>
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <Button variant="secondary" onClick={onCancel}>
                    Batal
                  </Button>
                  <Button type="submit" className="btn-alma-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Simpan Perubahan
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
  );
};

export default EditPatientForm;