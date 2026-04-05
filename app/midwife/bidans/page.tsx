// app/midwife/bidans/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Card, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import Link from 'next/link';

interface MidwifeEntry {
  id: string;
  userId: string;
  name: string;
  username: string;
  role: string;
  patientCount: number;
  createdAt: string;
}

const MidwivesListPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [midwives, setMidwives] = useState<MidwifeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMidwives = async () => {
      if (status === 'authenticated' && session?.user?.role === 'MIDWIFE') {
        try {
          const response = await fetch('/api/midwives', { credentials: 'include' });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch midwives');
          }
          const data: MidwifeEntry[] = await response.json();
          setMidwives(data);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
          setLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    fetchMidwives();
  }, [session, status, router]);

  if (status === 'loading' || loading) {
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
          <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-header-alma">
              <i className="bi bi-people-fill fs-4"></i>
              <div>
                <h5 className="mb-0 fw-bold">Daftar Bidan Terdaftar</h5>
                <small className="text-white-50">Total: {midwives.length} bidan</small>
              </div>
            </div>
            <Card.Body className="p-4">
              {error && (
                <Alert variant="danger" className="m-3 rounded-3 text-center">{error}</Alert>
              )}
              {midwives.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-inbox"></i>
                  <p className="text-muted mt-2">Belum ada bidan yang terdaftar</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table bordered hover className="mb-0 align-middle table-alma" style={{ fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th className="text-center">No</th>
                        <th className="text-center">Nama Bidan</th>
                        <th className="text-center">Username</th>
                        <th className="text-center">Jumlah Pasien</th>
                        <th className="text-center">Tanggal Daftar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {midwives.map((midwife, index) => (
                        <tr key={midwife.id}>
                          <td className="text-center">{index + 1}</td>
                          <td className="text-start fw-semibold text-alma-green">{midwife.name}</td>
                          <td className="text-center">{midwife.username}</td>
                          <td className="text-center">
                            <Badge bg="primary" className="badge-alma">{midwife.patientCount} pasien</Badge>
                          </td>
                          <td className="text-center">
                            {new Date(midwife.createdAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </Layout>
  );
};

export default MidwivesListPage;