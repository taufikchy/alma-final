'use client';

import { useEffect } from 'react';
import { Container, Button, Card } from 'react-bootstrap';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[Global Error]:', error);
  }, [error]);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <Container>
        <Card className="shadow-lg border-0 text-center p-4" style={{ borderRadius: '15px' }}>
          <Card.Body>
            <div className="mb-4">
              <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '4rem' }}></i>
            </div>
            <h2 className="fw-bold mb-3">Oops! Ada kesalahan sistem</h2>
            <p className="text-muted mb-4">
              Maaf Bunda, sepertinya aplikasi mengalami gangguan teknis sebentar. 
              Coba Bunda tekan tombol reload di bawah ya.
            </p>
            <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
              <Button 
                variant="success" 
                size="lg" 
                onClick={() => reset()}
                className="px-4 fw-bold"
                style={{ backgroundColor: '#2E7D32', border: 'none' }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reload Halaman
              </Button>
              <Button 
                variant="outline-secondary" 
                size="lg" 
                onClick={() => window.location.href = '/'}
                className="px-4"
              >
                Kembali ke Beranda
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
