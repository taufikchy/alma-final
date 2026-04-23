// app/patient/dashboard/page.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Alert, Spinner, Badge, Button } from 'react-bootstrap';
import DailyCheckForm from '@/components/DailyCheckForm';
import DailyCheckHistory from '@/components/DailyCheckHistory';
import { calculateGestationalAge } from '@/lib/gestationalAge';
import oneSignalService from '@/lib/onesignal';

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
  midwifeId?: string;
  midwife: {
    name: string;
  };
  dailyChecks?: {
    id: string;
    date: string;
    takenMedication: boolean;
    photoUrl?: string | null;
    notes?: string | null;
    createdAt: string;
  }[];
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

const PatientDashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(true);
  const [errorPatientDetails, setErrorPatientDetails] = useState<string | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const [alreadyCheckedToday, setAlreadyCheckedToday] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const hasPlayedRef = useRef(false);

  const checkTodaySubmission = useCallback((checks?: { date: string }[]) => {
    if (checks && checks.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const latestCheck = new Date(checks[0].date);
      latestCheck.setHours(0, 0, 0, 0);

      if (latestCheck.getTime() === today.getTime()) {
        setAlreadyCheckedToday(true);
      } else {
        setAlreadyCheckedToday(false);
      }
    } else {
      setAlreadyCheckedToday(false);
    }
  }, []);

  const handleDailyCheckSubmitted = useCallback(() => {
    setRefreshHistory(prev => prev + 1);
    setAlreadyCheckedToday(true);
    setShowReminder(false);
    hasPlayedRef.current = false;
    alarmDismissedByUserRef.current = false;
    setIsAlarmPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (audioRef.current) {
      const audio = audioRef.current;
      const currentPromise = playPromiseRef.current;
      
      const doPause = () => {
        audio.pause();
        audio.currentTime = 0;
      };
      
      if (currentPromise) {
        currentPromise.then(doPause).catch(doPause);
      } else {
        doPause();
      }
      
      audioRef.current = null;
      playPromiseRef.current = null;
    }
  }, []);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (status === 'authenticated' && session?.user && session?.user?.role === 'PATIENT' && session?.user?.id) {
        try {
          const response = await fetch('/api/patient-details', {
            credentials: 'include',
          });

          if (response.status === 401) {
            router.push('/login');
            return;
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
          }

          const data: PatientDetails = await response.json();
          setPatientDetails(data);
          checkTodaySubmission(data.dailyChecks);
          setErrorPatientDetails(null);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while fetching patient details.';
          setErrorPatientDetails(errorMessage);
        } finally {
          setLoadingPatientDetails(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    fetchPatientDetails();
  }, [session, status, router, refreshHistory, checkTodaySubmission]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const alarmDismissedByUserRef = useRef(false);

  const playNotificationSound = useCallback(() => {
    if (isPlayingRef.current) return;

    try {
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.loop = true;
      playPromiseRef.current = audioRef.current.play();
      playPromiseRef.current.then(() => {
        isPlayingRef.current = true;
        setIsAlarmPlaying(true);
      }).catch(e => {
        console.error('Audio play error:', e);
        isPlayingRef.current = false;
        setIsAlarmPlaying(false);
      });
    } catch (e) {
      console.error('Audio play error:', e);
      isPlayingRef.current = false;
      setIsAlarmPlaying(false);
    }
  }, []);

  const stopNotificationSound = useCallback(() => {
    isPlayingRef.current = false;
    setIsAlarmPlaying(false);

    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      if (audioRef.current) {
        const audio = audioRef.current;
        const currentPromise = playPromiseRef.current;
        
        const doPause = () => {
          audio.pause();
          audio.currentTime = 0;
        };
        
        if (currentPromise) {
          currentPromise.then(doPause).catch(doPause);
        } else {
          doPause();
        }
        
        audioRef.current = null;
        playPromiseRef.current = null;
      }
    } catch (e) {
      console.error('Error stopping audio:', e);
    }
  }, []);

  const showBrowserNotification = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 ALMA - Reminder Minum TTD', {
        body: 'Jangan lupa minum Tablet Tambah Darah (TTD) atau MMS hari ini ya Bund!',
        icon: '/favicon.ico',
        tag: 'alma-reminder',
        requireInteraction: true,
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('🔔 ALMA - Reminder Minum TTD', {
            body: 'Jangan lupa minum Tablet Tambah Darah (TTD) atau MMS hari ini ya Bund!',
            icon: '/favicon.ico',
            tag: 'alma-reminder',
            requireInteraction: true,
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    }
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_ALARM',
        patientId: patientDetails?.id,
        checkTime: 19,
        snoozeInterval: 10 * 60 * 1000,
      });
    }
  }, [session, status, patientDetails]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'PATIENT' && patientDetails?.id) {
      oneSignalService.init().then(async () => {
        const storageKey = `notificationsEnabled_${patientDetails.id}`;
        const explicitConsent = localStorage.getItem(storageKey) === 'true';

        if (explicitConsent) {
          try {
            await oneSignalService.setExternalUserId(patientDetails.id);
            await oneSignalService.sendTags({
              patientId: patientDetails.id,
              midwifeId: patientDetails.midwifeId || '',
            });
          } catch (e) {
            console.log('OneSignal sync failed, will retry later');
          }
          setNotificationEnabled(true);
        } else {
          const isEnabled = await oneSignalService.isSubscribed();
          setNotificationEnabled(isEnabled);
        }
      });
    }
  }, [session, status, patientDetails]);

  const handleEnableNotifications = async () => {
    const storageKey = `notificationsEnabled_${patientDetails?.id}`;
    const granted = await oneSignalService.requestPermission();
    if (granted && patientDetails?.id) {
      localStorage.setItem(storageKey, 'true');
      await oneSignalService.setExternalUserId(patientDetails.id);
      await oneSignalService.sendTags({
        patientId: patientDetails.id,
        midwifeId: patientDetails.midwifeId || '',
      });
      setNotificationEnabled(true);
    } else if (Notification.permission === 'granted') {
      localStorage.setItem(storageKey, 'true');
      if (patientDetails?.id) {
        await oneSignalService.setExternalUserId(patientDetails.id);
        await oneSignalService.sendTags({
          patientId: patientDetails.id,
          midwifeId: patientDetails.midwifeId || '',
        });
      }
      setNotificationEnabled(true);
    }
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'ALARM_TRIGGERED') {
          setShowReminder(true);
          playNotificationSound();
          setIsAlarmPlaying(true);
        }
        if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
          router.push('/patient/dashboard');
        }
      });
    }
  }, [playNotificationSound, router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      stopNotificationSound();
      hasPlayedRef.current = false;
    }
  }, [status, stopNotificationSound]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      stopNotificationSound();
      hasPlayedRef.current = false;
      setShowReminder(false);
    }
  }, []);

  const checkAndNotifyRef = useRef<() => void>(() => {});

  useEffect(() => {
    const performNotify = () => {
      if (!session || session.user?.role !== 'PATIENT') return;
      if (hasPlayedRef.current) return;
      if (alreadyCheckedToday) return;
      if (alarmDismissedByUserRef.current) return;

      const now = new Date();
      const currentHour = now.getHours();

      if (currentHour >= 19) {
        setShowReminder(true);
        playNotificationSound();
        showBrowserNotification();
        hasPlayedRef.current = true;
        alarmDismissedByUserRef.current = false;
      }
    };

    checkAndNotifyRef.current = performNotify;
    performNotify();

    const interval = setInterval(performNotify, 30000);
    return () => {
      clearInterval(interval);
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      
      const audio = audioRef.current;
      const currentPromise = playPromiseRef.current;
      
      const doPause = () => {
        if (audio) {
          try { audio.pause(); audio.currentTime = 0; } catch {}
        }
      };
      
      if (currentPromise) {
        currentPromise.then(doPause).catch(doPause);
      } else {
        doPause();
      }
      
      audioRef.current = null;
      playPromiseRef.current = null;
      hasPlayedRef.current = false;
    };
  }, [alreadyCheckedToday, showBrowserNotification, session]);

  if (status === 'loading' || loadingPatientDetails) {
    return (
      <Layout>
        <div className="text-center mt-5">
          <Spinner animation="border" />
          <p className="mt-3">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!session || session.user.role !== 'PATIENT') {
    return null;
  }

  if (errorPatientDetails) {
    return (
      <Layout>
        <Container className="mt-5">
          <Alert variant="danger" className="text-center">{errorPatientDetails}</Alert>
        </Container>
      </Layout>
    );
  }

  if (!patientDetails) {
    return (
      <Layout>
        <Container className="mt-5">
          <Alert variant="warning" className="text-center">Detail pasien tidak ditemukan.</Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ backgroundColor: '#FFF5F8', minHeight: '100vh' }} className="py-4">
        <Container>
          {showReminder && !alreadyCheckedToday && (
            <Alert variant="danger" className="d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ fontSize: '1.1rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(220, 53, 69, 0.4)' }}>
              <div className="d-flex align-items-center flex-grow-1">
                <i className={`${isAlarmPlaying ? 'animate-bell' : ''}`} style={{ fontSize: '2rem' }}>
                  <img src="/logo.png" alt="ALMA Logo" style={{ height: '40px' }} />
                </i>
                <div>
                  <strong className="d-block fs-5">🔔 Reminder Minum TTD! 🔔</strong>
                  <span>Jangan lupa minum Tablet Tambah Darah (TTD) atau MMS ya Bund!</span>
                </div>
              </div>
              <div className="d-flex gap-2 align-items-center">
                {isAlarmPlaying && (
                  <button
                    type="button"
                    className="btn btn-lg btn-danger fw-bold"
                    onClick={() => {
                      setIsAlarmPlaying(false);
                      setShowReminder(false);
                      if (intervalRef.current) {
                        clearTimeout(intervalRef.current);
                        intervalRef.current = null;
                      }
                      const audio = audioRef.current;
                      const currentPromise = playPromiseRef.current;
                      const doPause = () => {
                        if (audio) {
                          audio.pause();
                          audio.currentTime = 0;
                        }
                      };
                      if (currentPromise) {
                        currentPromise.then(doPause).catch(doPause);
                      } else {
                        doPause();
                      }
                      audioRef.current = null;
                      playPromiseRef.current = null;
                      alarmDismissedByUserRef.current = true;

                      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({
                          type: 'SNOOZE_ALARM',
                          snoozeInterval: 10 * 60 * 1000,
                        });
                      }

                      setTimeout(() => {
                        if (!alreadyCheckedToday && session?.user?.role === 'PATIENT') {
                          setShowReminder(true);
                          playNotificationSound();
                          showBrowserNotification();
                        }
                      }, 10 * 60 * 1000);
                    }}
                    title="Matikan alarm"
                  >
                    <i className="bi bi-stop-fill me-2"></i>
                    MATIKAN ALARM
                  </button>
                )}
                <button
                  type="button"
                  className="btn-close btn-close-lg"
                  onClick={() => {
                    setIsAlarmPlaying(false);
                    setShowReminder(false);
                    if (intervalRef.current) {
                      clearTimeout(intervalRef.current);
                      intervalRef.current = null;
                    }
                    const audio = audioRef.current;
                    const currentPromise = playPromiseRef.current;
                    const doPause = () => {
                      if (audio) {
                        audio.pause();
                        audio.currentTime = 0;
                      }
                    };
                    if (currentPromise) {
                      currentPromise.then(doPause).catch(doPause);
                    } else {
                      doPause();
                    }
                    audioRef.current = null;
                    playPromiseRef.current = null;
                    alarmDismissedByUserRef.current = true;

                    setTimeout(() => {
                      if (!alreadyCheckedToday && session?.user?.role === 'PATIENT') {
                        setShowReminder(true);
                        playNotificationSound();
                        showBrowserNotification();
                      }
                    }, 10 * 60 * 1000);
                  }}
                  aria-label="Close"
                ></button>
              </div>
            </Alert>
          )}

          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="fw-bold text-alma-green mb-2">
                <i className="bi bi-heart-pulse me-2"></i>
                Selamat Datang, {patientDetails.name}!
              </h3>
              <p className="text-muted mb-0">Dashboard Pasien - Alarm Lawan Anemia</p>
              {alreadyCheckedToday && (
                <Badge bg="success" className="mt-2 px-3 py-2">
                  <i className="bi bi-check-circle me-1"></i>
                  Daily Check hari ini sudah selesai!
                </Badge>
              )}
            </Card.Body>
          </Card>

          {!notificationEnabled && (
            <Card className="mb-4 border-0 shadow-sm" style={{ backgroundColor: '#FFF3CD' }}>
              <Card.Body className="d-flex align-items-center justify-content-between flex-wrap gap-3 py-3">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-bell-fill fs-3 text-warning"></i>
                  <div>
                    <strong>Aktifkan Notifikasi</strong>
                    <p className="mb-0 text-muted small">Dapatkan pengingat minum TTD setiap hari pukul 19:00</p>
                  </div>
                </div>
                <Button
                  variant="warning"
                  className="fw-bold"
                  onClick={handleEnableNotifications}
                >
                  <i className="bi bi-bell me-2"></i>
                  Aktifkan
                </Button>
              </Card.Body>
            </Card>
          )}

          {notificationEnabled && (
            <Card className="mb-4 border-0 shadow-sm" style={{ backgroundColor: '#D4EDDA' }}>
              <Card.Body className="d-flex align-items-center justify-content-between flex-wrap gap-3 py-3">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-bell-check-fill fs-3 text-success"></i>
                  <div>
                    <strong>Notifikasi Aktif</strong>
                    <p className="mb-0 text-muted small">Pengingat akan muncul setiap hari pukul 19:00</p>
                  </div>
                </div>
                <Badge bg="success" className="px-3 py-2">
                  <i className="bi bi-check-circle me-1"></i>
                  Enabled
                </Badge>
              </Card.Body>
            </Card>
          )}

          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="card-header-alma text-center">
                  <i className="bi bi-person me-2"></i>
                  <span className="fw-bold">Informasi Bidan</span>
                </Card.Header>
                <Card.Body className="text-center">
                  <i className="bi bi-clipboard2-pulse fs-1 text-alma-green mb-3 d-block"></i>
                  <p className="mb-1"><strong>Bidan Anda:</strong></p>
                  <h5 className="text-alma-green">{patientDetails.midwife?.name || 'N/A'}</h5>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="card-header-alma-pink text-center">
                  <i className="bi bi-heart-pulse me-2"></i>
                  <span className="fw-bold">Info Kehamilan</span>
                </Card.Header>
                <Card.Body className="text-center">
                  <Row className="g-3">
                    <Col xs={6}>
                      <Badge bg="primary" className="badge-alma d-block mb-2 px-3 py-2">
                        <i className="bi bi-calendar3 me-1"></i>
                        {calculateGestationalAge(patientDetails.lastMenstrualPeriod)} Minggu
                      </Badge>
                      <small className="text-muted">Usia Kehamilan</small>
                    </Col>
                    <Col xs={6}>
                      <Badge bg="info" className="badge-alma d-block mb-2 px-3 py-2">
                        <i className="bi bi-calendar-check me-1"></i>
                        {new Date(patientDetails.estimatedDueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Badge>
                      <small className="text-muted">HPL</small>
                    </Col>
                    <Col xs={6}>
                      {patientDetails.lastHemoglobin !== null && patientDetails.lastHemoglobin !== undefined ? (
                        <>
                          <Badge bg={getHbClassification(patientDetails.lastHemoglobin).variant} className="badge-alma d-block mb-2 px-3 py-2">
                            <i className="bi bi-droplet me-1"></i>
                            {patientDetails.lastHemoglobin} g/dL
                          </Badge>
                          <small className="text-muted">
                            {getHbClassification(patientDetails.lastHemoglobin).text}
                          </small>
                        </>
                      ) : (
                        <>
                          <Badge bg="secondary" className="badge-alma d-block mb-2 px-3 py-2">
                            <i className="bi bi-droplet me-1"></i>
                            N/A
                          </Badge>
                          <small className="text-muted">HB Terakhir</small>
                        </>
                      )}
                    </Col>
                    <Col xs={6}>
                      <Badge bg={patientDetails.hasMiscarriage ? 'warning' : 'secondary'} className="badge-alma d-block mb-2 px-3 py-2">
                        <i className="bi bi-activity me-1"></i>
                        {patientDetails.hasMiscarriage ? `${patientDetails.miscarriageCount || 0}x` : 'Tidak'}
                      </Badge>
                      <small className="text-muted">Riwayat Keguguran</small>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4">
            <Col md={6}>
              {alreadyCheckedToday ? (
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center py-5">
                    <i className="bi bi-check-circle-fill text-success fs-5 mb-3 d-block"></i>
                    <h5 className="text-success fw-bold mb-2">Daily Check Selesai!</h5>
                    <p className="text-muted mb-0">
                      Kamu sudah melakukan daily check hari ini.<br />
                      Sampai jumpa besok ya! 😊
                    </p>
                    <Badge bg="success" className="mt-3 px-3 py-2">
                      <i className="bi bi-calendar-check me-1"></i>
                      Cek lagi besok
                    </Badge>
                  </Card.Body>
                </Card>
              ) : (
                <DailyCheckForm onDailyCheckSubmitted={handleDailyCheckSubmitted} />
              )}
            </Col>
            <Col md={6}>
              <DailyCheckHistory
                refreshTrigger={refreshHistory}
                patientId={patientDetails.id}
                initialData={patientDetails.dailyChecks}
              />
            </Col>
          </Row>
        </Container>
      </div>
    </Layout>
  );
};

export default PatientDashboardPage;