// components/DailyCheckHistory.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, ListGroup, Alert, Spinner, Badge } from 'react-bootstrap';

interface DailyCheck {
  id: string;
  date: string;
  takenMedication: boolean;
  photoUrl?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface DailyCheckHistoryProps {
  refreshTrigger?: number;
  patientId?: string;
  initialData?: DailyCheck[];
}

const DailyCheckHistory: React.FC<DailyCheckHistoryProps> = ({ refreshTrigger = 0, patientId, initialData }) => {
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState<string | null>(null);

  const fetchDailyChecks = useCallback(async () => {
    if (!patientId) {
      setError('Patient ID is required.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dailycheck?patientId=${patientId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch daily checks');
      }
      const data: DailyCheck[] = await response.json();
      setDailyChecks(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId && !initialData) {
      fetchDailyChecks();
    }
  }, [patientId, fetchDailyChecks, initialData]);

  useEffect(() => {
    if (refreshTrigger > 0 && patientId) {
      fetchDailyChecks();
    }
  }, [refreshTrigger, patientId, fetchDailyChecks]);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2 mb-0 text-muted">Memuat riwayat...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <Card.Body>
          <Alert variant="danger" className="mb-0">{error}</Alert>
        </Card.Body>
      </Card>
    );
  }

  if (dailyChecks.length === 0) {
    return (
      <Card className="shadow-sm">
        <Card.Header className="card-header-alma text-center fw-bold">
          <i className="bi bi-clock-history me-2"></i>
          Riwayat Daily Check
        </Card.Header>
        <Card.Body className="text-center py-4">
          <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
          <p className="text-muted mb-0">Belum ada riwayat daily check.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="card-header-alma text-center fw-bold">
          <i className="bi bi-clock-history me-2"></i>
          Riwayat Daily Check
        </Card.Header>
        <Card.Body className="p-0">
          <ListGroup variant="flush" className="daily-check-history">
            {dailyChecks.map((check, index) => (
              <ListGroup.Item key={check.id} className={index === 0 ? 'bg-light' : ''}>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="me-3">
                    <Badge bg={check.takenMedication ? 'success' : 'warning'} className="mb-2 px-2 py-1">
                      <i className={`bi ${check.takenMedication ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                      {check.takenMedication ? 'Sudah' : 'Belum'}
                    </Badge>
                    <p className="mb-1 small text-muted">
                      <i className="bi bi-calendar3 me-1"></i>
                      {new Date(check.date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                      <span className="ms-2">
                        <i className="bi bi-clock me-1"></i>
                        {new Date(check.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                    {check.notes && (
                      <p className="mb-1 small">
                        <i className="bi bi-sticky me-1 text-muted"></i>
                        {check.notes}
                      </p>
                    )}
                  </div>
                  {check.photoUrl && (
                    <div className="text-end">
                      <img
                        src={check.photoUrl}
                        alt="Bukti minum obat"
                        className="rounded daily-check-photo"
                        onClick={() => setShowPhotoModal(check.photoUrl || null)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>

      {showPhotoModal && (
        <div
          className="photo-modal-overlay"
          onClick={() => setShowPhotoModal(null)}
        >
          <div className="photo-modal-content">
            <button
              type="button"
              className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
              onClick={() => setShowPhotoModal(null)}
              aria-label="Close"
            ></button>
            <img src={showPhotoModal} alt="Bukti minum obat" className="photo-modal-image" />
          </div>
        </div>
      )}
    </>
  );
};

export default DailyCheckHistory;