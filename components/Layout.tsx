// components/Layout.tsx
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  isAlarmPlaying?: boolean;
}

export default function Layout({ children, isAlarmPlaying = false }: LayoutProps) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar isAlarmPlaying={isAlarmPlaying} />
      <main className="flex-grow-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}