// app/midwife/register-patient/page.tsx
"use client";

import Layout from '@/components/Layout';
import RegisterPatientForm from '@/components/RegisterPatientForm';

const RegisterPatientPage = () => {
  return (
    <Layout>
      <RegisterPatientForm />
    </Layout>
  );
};

export default RegisterPatientPage;