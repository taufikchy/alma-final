// components/DailyCheckForm.tsx
"use client";

import { useState, useRef } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { useSession } from 'next-auth/react';

interface DailyCheckFormProps {
  onDailyCheckSubmitted: () => void;
}

const DailyCheckForm: React.FC<DailyCheckFormProps> = ({ onDailyCheckSubmitted }) => {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [takenMedication, setTakenMedication] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran foto maksimal 5MB');
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!takenMedication) {
      setError('Anda harus mencentang "Sudah minum tablet tambah darah (TTD) atau MMS" sebelum mengirim.');
      setLoading(false);
      return;
    }

    if (!session?.user?.id) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('takenMedication', String(takenMedication));
      formData.append('notes', notes);
      if (photo) {
        formData.append('photo', photo);
      }

      const response = await fetch('/api/dailycheck', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit daily check');
      }

      setSuccess('Daily check berhasil disimpan!');
      setTakenMedication(false);
      setPhoto(null);
      setPhotoPreview(null);
      setNotes('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onDailyCheckSubmitted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
      <div className="card-header text-white py-3" style={{ backgroundColor: '#DC3545' }}>
        <h5 className="mb-0 fw-bold text-center">
          <i className="bi bi-clipboard2-check me-2"></i>
          Catat Daily Check
        </h5>
      </div>

      <Card.Body className="p-4">
        {error && (
          <Alert variant="danger" className="mb-3 py-2 text-center">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="mb-3 py-2 text-center">
            <i className="bi bi-check-circle-fill me-2"></i>
            {success}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <div className="mb-4 p-3 rounded" style={{ backgroundColor: takenMedication ? '#D4EDDA' : '#FFF3CD', border: `2px solid ${takenMedication ? '#28A745' : '#FFC107'}` }}>
            <div className="d-flex align-items-center gap-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="takenMedication"
                checked={takenMedication}
                onChange={(e) => setTakenMedication(e.target.checked)}
                style={{ width: '24px', height: '24px', cursor: 'pointer' }}
              />
              <label className="form-check-label fw-medium flex-grow-1" htmlFor="takenMedication" style={{ fontSize: '1.1rem', cursor: 'pointer' }}>
                Sudah minum tablet tambah darah (TTD) atau MMS?
              </label>
            </div>
          </div>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold text-muted small text-uppercase">
              <i className="bi bi-camera me-1"></i> Foto Bukti (Opsional)
            </Form.Label>
            <div className="d-flex flex-column align-items-center gap-3">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                className="form-control"
                style={{ maxWidth: '300px' }}
              />
              {photoPreview && (
                <div className="position-relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="rounded shadow-sm"
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 end-0 translate-middle rounded-circle"
                    onClick={clearPhoto}
                  >
                    <i className="bi bi-x"></i>
                  </Button>
                </div>
              )}
            </div>
            <Form.Text className="text-muted small d-block text-center mt-2">
              Maks 5MB, format JPG/PNG
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold text-muted small text-uppercase">
              <i className="bi bi-pencil me-1"></i> Catatan (Opsional)
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Tambahkan catatan Anda di sini..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border-2"
              style={{ borderRadius: '12px' }}
            />
          </Form.Group>

          <div className="d-grid gap-2 col-10 mx-auto">
            <Button
              variant="success"
              type="submit"
              disabled={loading}
              className="py-2 fw-bold shadow-sm"
              style={{ borderRadius: '12px', fontSize: '1.1rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Simpan Daily Check
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </div>
  );
};

export default DailyCheckForm;