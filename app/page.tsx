// app/page.tsx
"use client";

import Layout from '@/components/Layout';
import { Container, Row, Col, Card } from 'react-bootstrap';

export default function HomePage() {
  return (
    <Layout>
      <div style={{ backgroundColor: '#FFF5F8', minHeight: '100vh' }} className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold text-alma-green mb-3">
              <img src="/logo.png" alt="ALMA Logo" style={{ height: '60px', marginRight: '12px' }} /> ALMA
            </h1>
            <p className="lead text-muted mb-2">Aplikasi Layanan Manajemen Antenatal</p>
            <p className="text-muted">Alarm Lawan Anemia - Untuk ibu hamil Indonesia yang lebih sehat</p>
            </div>

          <Row className="g-4 justify-content-center mb-5">
            <Col md={6} lg={4}>
              <Card className="border-0 shadow-sm h-100 text-center">
                <Card.Body className="p-4 d-flex flex-column">
                  <i className="bi bi-heart-pulse-fill text-alma-pink fs-1 mb-3"></i>
                  <h4 className="fw-bold text-alma-green mb-3">Monitoring Kesehatan</h4>
                  <p className="text-muted mb-0">
                    Pantau kesehatan ibu hamil dengan mudah dan teratur melalui daily check harian
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={4}>
              <Card className="border-0 shadow-sm h-100 text-center">
                <Card.Body className="p-4 d-flex flex-column">
                  <i className="bi bi-clipboard2-pulse text-alma-green fs-1 mb-3"></i>
                  <h4 className="fw-bold text-alma-green mb-3">Manajemen Bidan</h4>
                  <p className="text-muted mb-0">
                    Bidan dapat mengelola data pasien dan memantau perkembangan kehamilan dengan lebih efisien
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={4}>
              <Card className="border-0 shadow-sm h-100 text-center">
                <Card.Body className="p-4 d-flex flex-column">
                  <i className="bi bi-book text-alma-pink fs-1 mb-3"></i>
                  <h4 className="fw-bold text-alma-green mb-3">Materi Edukasi</h4>
                  <p className="text-muted mb-0">
                    Akses materi edukasi tentang kesehatan ibu hamil dan anemia kapan saja
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <h5 className="fw-bold text-alma-green text-center mb-4">
                <i className="bi bi-info-circle me-2"></i>
                Tentang ALMA
              </h5>
              <Row className="g-4">
                <Col md={6}>
                  <div className="d-flex align-items-start gap-3">
                    <i className="bi bi-shield-check text-alma-green fs-4"></i>
                    <div>
                      <h6 className="fw-bold mb-1">Keamanan Data</h6>
                      <p className="text-muted small mb-0">Data kesehatan Anda dienkripsi dan aman</p>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-start gap-3">
                    <i className="bi bi-people text-alma-green fs-4"></i>
                    <div>
                      <h6 className="fw-bold mb-1">Mudah Digunakan</h6>
                      <p className="text-muted small mb-0">Antarmuka yang sederhana dan intuitif</p>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-start gap-3">
                    <i className="bi bi-phone text-alma-green fs-4"></i>
                    <div>
                      <h6 className="fw-bold mb-1">Akses di Mana Saja</h6>
                      <p className="text-muted small mb-0">Bisa diakses dari komputer dan smartphone</p>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-start gap-3">
                    <i className="bi bi-clock-history text-alma-green fs-4"></i>
                    <div>
                      <h6 className="fw-bold mb-1">Monitoring Real-time</h6>
                      <p className="text-muted small mb-0">Pantau perkembangan kesehatan setiap hari</p>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </Layout>
  );
}