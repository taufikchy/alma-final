// app/midwife/edit-patient/[patientId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import EditPatientForm from '@/components/EditPatientForm';
import { Spinner } from 'react-bootstrap';

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

const EditPatientPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchPatient = async () => {
      if (status === 'authenticated' && (session?.user?.role === 'MIDWIFE' || session?.user?.role === 'SUPER_ADMIN') && patientId) {
        try {
          const response = await fetch(`/api/patients/${patientId}`, {
            signal: abortController.signal,
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch patient');
          }
          const data = await response.json();
          setPatient(data);
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== 'AbortError') {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
          }
        } finally {
          if (!abortController.signal.aborted) {
            setLoading(false);
          }
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      } else if (status === 'authenticated' && session?.user?.role !== 'MIDWIFE' && session?.user?.role !== 'SUPER_ADMIN') {
        setError('Anda tidak memiliki akses ke halaman ini.');
        setLoading(false);
      }
    };

    fetchPatient();

    return () => {
      abortController.abort();
    };
  }, [session, status, patientId, router]);

  const handleSuccess = () => {
    router.push('/midwife/dashboard');
  };

  const handleCancel = () => {
    router.push('/midwife/dashboard');
  };

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

  if (error || !patient) {
    return (
      <Layout>
        <div className="text-center mt-5">
          <p className="text-danger">{error || 'Patient not found'}</p>
          <button className="btn btn-secondary" onClick={() => router.push('/midwife/dashboard')}>
            Kembali ke Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ backgroundColor: '#FFF5F8', minHeight: '100vh' }} className="py-4">
        <div className="container">
          <EditPatientForm
            patient={patient}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </Layout>
  );
};

export default EditPatientPage;