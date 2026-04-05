"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

interface AuthSessionProviderProps {
  children: React.ReactNode;
}

export default function AuthSessionProvider({
  children,
}: AuthSessionProviderProps) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      {children}
    </SessionProvider>
  );
}
