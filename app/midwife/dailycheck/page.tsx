// app/midwife/dailycheck/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Table, Badge, Spinner, Alert, Form, Button, Modal } from 'react-bootstrap';
import Image from 'next/image';
import { calculateGestationalAge } from '@/lib/gestationalAge';

interface DailyCheckEntry {
  id: string;
  patientId: string;
  patientName: string;
  lastMenstrualPeriod: string;
  date: string;
  createdAt: string;
  takenMedication: boolean;
  photoUrl?: string | null;
  notes?: string | null;
}

const MidwifeDailyCheckPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dailyChecks, setDailyChecks] = useState<DailyCheckEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showPhotoModal, setShowPhotoModal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const fetchDailyChecks = useCallback(async (date?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = date
        ? `/api/midwife-dailycheck?date=${date}`
        : '/api/midwife-dailycheck';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch daily checks');
      }
      const data: DailyCheckEntry[] = await response.json();
      setDailyChecks(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'MIDWIFE') {
      fetchDailyChecks(selectedDate || undefined);
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [session, status, router, fetchDailyChecks, selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const clearDateFilter = () => {
    setSelectedDate('');
  };

  const getChecksByDate = () => {
    const grouped: Record<string, DailyCheckEntry[]> = {};
    dailyChecks.forEach(check => {
      const dateKey = new Date(check.date).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(check);
    });
    return grouped;
  };

  const renderCalendarView = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const checksByDate = getChecksByDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <Card className="shadow-sm">
        <Card.Header className="card-header-alma text-center fw-bold">
          <i className="bi bi-calendar3 me-2"></i>
          {today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-3">
            <Badge bg="success" className="me-2">
              <i className="bi bi-circle-fill me-1"></i> Sudah Check
            </Badge>
            <Badge bg="warning">
              <i className="bi bi-circle me-1"></i> Belum Check
            </Badge>
          </div>
          <div className="table-responsive">
            <Table className="table-alma mb-0 text-center">
              <thead>
                <tr>
                  <th>Min</th>
                  <th>Sen</th>
                  <th>Sel</th>
                  <th>Rab</th>
                  <th>Kam</th>
                  <th>Jum</th>
                  <th>Sab</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, weekIndex) => (
                  <tr key={weekIndex}>
                    {week.map((day, dayIndex) => {
                      const dateStr = day
                        ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        : null;
                      const hasChecks = dateStr && checksByDate[dateStr]?.length > 0;
                      const allChecked = dateStr && checksByDate[dateStr]?.every(c => c.takenMedication);
                      const someChecked = dateStr && hasChecks && !allChecked;

                      return (
                        <td
                          key={dayIndex}
                          className={`
                            ${day ? 'day-cell' : ''}
                            ${dateStr === selectedDate ? 'selected-date' : ''}
                            ${dateStr === new Date().toISOString().split('T')[0] ? 'today-date' : ''}
                          `}
                          onClick={() => day && setSelectedDate(dateStr || '')}
                          style={{ cursor: day ? 'pointer' : 'default', height: '50px' }}
                        >
                          {day && (
                            <>
                              <div className="fw-bold">{day}</div>
                              {hasChecks && (
                                <div className="mt-1">
                                  <Badge bg={allChecked ? 'success' : someChecked ? 'info' : 'warning'} className="badge-alma">
                                    {checksByDate[dateStr].length}
                                  </Badge>
                                </div>
                              )}
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    );
  };

  const renderListView = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-3">Memuat data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="text-center">{error}</Alert>
      );
    }

    if (dailyChecks.length === 0) {
      return (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
            <p className="text-muted mb-0">
              {selectedDate
                ? 'Tidak ada data daily check pada tanggal ini.'
                : 'Belum ada data daily check.'}
            </p>
          </Card.Body>
        </Card>
      );
    }

    const groupedChecks = getChecksByDate();
    const sortedDates = Object.keys(groupedChecks).sort((a, b) => b.localeCompare(a));

    return (
      <Card className="shadow-sm">
        <Card.Header className="card-header-alma text-center fw-bold">
          <i className="bi bi-list-ul me-2"></i>
          Riwayat Daily Check Pasien
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="table-alma mb-0" hover>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Pasien</th>
                  <th>Usia Kehamilan</th>
                  <th>Tanggal & Jam</th>
                  <th>Status</th>
                  <th>Catatan</th>
                  <th>Bukti</th>
                </tr>
              </thead>
              <tbody>
                {dailyChecks.map((check, index) => (
                  <tr key={check.id}>
                    <td>{index + 1}</td>
                    <td className="fw-bold">{check.patientName}</td>
                    <td>{calculateGestationalAge(check.lastMenstrualPeriod)} minggu</td>
                    <td>
                      <div>{new Date(check.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <small className="text-muted">
                        <i className="bi bi-clock me-1"></i>
                        {new Date(check.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </td>
                    <td>
                      <Badge bg={check.takenMedication ? 'success' : 'warning'} className="badge-alma">
                        <i className={`bi ${check.takenMedication ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                        {check.takenMedication ? 'Sudah' : 'Belum'}
                      </Badge>
                    </td>
                    <td>
                      {check.notes ? (
                        <small title={check.notes}>{check.notes.substring(0, 30)}{check.notes.length > 30 ? '...' : ''}</small>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {check.photoUrl && (
                        <img
                          src={check.photoUrl}
                          alt="Bukti"
                          className="rounded daily-check-photo"
                          onClick={() => setShowPhotoModal(check.photoUrl || null)}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (status === 'loading') {
    return (
      <Layout>
        <div className="text-center mt-5">
          <Spinner animation="border" />
          <p className="mt-3">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!session || session.user?.role !== 'MIDWIFE') {
    return null;
  }

  return (
    <Layout>
      <div style={{ backgroundColor: '#FFF5F8', minHeight: '100vh' }} className="py-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="fw-bold text-alma-green mb-0">
              <i className="bi bi-clipboard2-check me-2"></i>
              Daily Check Pasien
            </h3>
            <div className="d-flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'btn-alma-primary' : ''}
              >
                <i className="bi bi-list-ul me-1"></i> List
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={viewMode === 'calendar' ? 'btn-alma-primary' : ''}
              >
                <i className="bi bi-calendar3 me-1"></i> Kalender
              </Button>
            </div>
          </div>

          <Card className="mb-4 shadow-sm">
            <Card.Body className="d-flex align-items-center gap-3 flex-wrap">
              <span className="fw-bold">Filter Tanggal:</span>
              <Form.Control
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                style={{ maxWidth: '200px' }}
              />
              {selectedDate && (
                <Button variant="outline-secondary" size="sm" onClick={clearDateFilter}>
                  <i className="bi bi-x-lg me-1"></i> Clear
                </Button>
              )}
              <span className="ms-auto text-muted small">
                Menampilkan {dailyChecks.length} data
              </span>
            </Card.Body>
          </Card>

          {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
        </Container>
      </div>

      <Modal show={!!showPhotoModal} onHide={() => setShowPhotoModal(null)} centered size="lg">
        <Modal.Body className="p-0 text-center" style={{ backgroundColor: '#000' }}>
          {showPhotoModal && (
            <img
              src={showPhotoModal}
              alt="Bukti daily check"
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#000', border: 'none' }}>
          <Button variant="secondary" onClick={() => setShowPhotoModal(null)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};

export default MidwifeDailyCheckPage;