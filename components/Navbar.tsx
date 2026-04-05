// components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Dropdown } from 'react-bootstrap';
import { useEffect, useState, useRef } from 'react';

interface NavbarProps {
  isAlarmPlaying?: boolean;
}

const Navbar = ({ isAlarmPlaying = false }: NavbarProps) => {
  const { data: session } = useSession();
  const [displayName, setDisplayName] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const initBootstrap = async () => {
      const bootstrap = await import('bootstrap/dist/js/bootstrap.bundle.min.js');
    };
    initBootstrap();
  }, []);

  useEffect(() => {
    const fetchPendingCount = async () => {
      if (session?.user && (session.user.role === 'MIDWIFE' || session.user.role === 'SUPER_ADMIN')) {
        try {
          const response = await fetch('/api/midwife/pending-checks/count', { credentials: 'include' });
          if (response.ok) {
            const data = await response.json();
            setPendingCount(data.count);
          }
        } catch (err) {
          console.error('Error fetching pending count:', err);
        }
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const fetchUserName = async () => {
      if (session?.user?.id) {
        try {
          if (session.user.role === 'MIDWIFE') {
            const response = await fetch('/api/midwife-profile', { credentials: 'include' });
            if (response.ok) {
              const data = await response.json();
              setDisplayName(data.name);
            } else {
              setDisplayName(session.user.username || 'User');
            }
          } else if (session.user.role === 'PATIENT') {
            const response = await fetch('/api/patient-profile', { credentials: 'include' });
            if (response.ok) {
              const data = await response.json();
              setDisplayName(data.name);
            } else {
              setDisplayName(session.user.username || 'User');
            }
          } else if (session.user.role === 'SUPER_ADMIN') {
            setDisplayName(session.user.username || 'Super Admin');
          }
        } catch {
          setDisplayName(session.user.username || 'User');
        }
      }
    };

    fetchUserName();
  }, [session]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    closeMenu();
    signOut();
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'MIDWIFE':
        return 'Bidan';
      case 'PATIENT':
        return 'Pasien';
      case 'SUPER_ADMIN':
        return 'Super Admin';
      default:
        return role;
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-alma sticky-top" ref={navRef}>
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" href="/">
          <span className={isAlarmPlaying ? 'animate-bell' : ''} style={{ display: 'inline-flex' }}>
            <img src="/logo.png" alt="ALMA Logo" style={{ height: '32px', marginRight: '8px' }} />
          </span>
          <span className="fs-4 fw-bold text-alma-green">ALMA</span>
        </Link>
        <button
          className={`navbar-toggler border-0 ${isMenuOpen ? 'collapsed' : ''}`}
          type="button"
          onClick={toggleMenu}
          aria-controls="navbarNav"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item mx-1">
              <Link className="nav-link text-center" href="/" onClick={closeMenu}>
                <i className="bi bi-house-door me-1"></i> Beranda
              </Link>
            </li>
            {session ? (
              <>
                <li className="nav-item mx-1">
                  <Link className="nav-link text-center" href="/patient/educational-materials" onClick={closeMenu}>
                    <i className="bi bi-book me-1"></i> Materi Edukasi
                  </Link>
                </li>
                {session.user.role === 'PATIENT' && (
                  <li className="nav-item mx-1">
                    <Link className="nav-link text-center" href="/patient/dashboard" onClick={closeMenu}>
                      <i className="bi bi-person me-1"></i> Dashboard Pasien
                    </Link>
                  </li>
                )}
                {session.user.role === 'MIDWIFE' && (
                  <>
                    <li className="nav-item mx-1">
                      <Link className="nav-link text-center d-flex justify-content-center align-items-center gap-2" href="/midwife/dashboard" onClick={closeMenu}>
                        <i className="bi bi-clipboard2-pulse me-1"></i> Dashboard Bidan
                        {pendingCount > 0 && <span className="badge bg-danger rounded-pill">{pendingCount}</span>}
                      </Link>
                    </li>
                    <li className="nav-item mx-1">
                      <Link className="nav-link text-center" href="/midwife/dailycheck" onClick={closeMenu}>
                        <i className="bi bi-clipboard2-check me-1"></i> Daily Check
                      </Link>
                    </li>
                  </>
                )}
                {session.user.role === 'SUPER_ADMIN' && (
                  <>
                    <li className="nav-item mx-1">
                      <Link className="nav-link text-center d-flex justify-content-center align-items-center gap-2" href="/superadmin/dashboard" onClick={closeMenu}>
                        <i className="bi bi-shield-lock me-1"></i> Dashboard Super Admin
                        {pendingCount > 0 && <span className="badge bg-danger rounded-pill">{pendingCount}</span>}
                      </Link>
                    </li>
                  </>
                )}
                <li className="nav-item mx-1">
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="light" size="sm" className="d-flex align-items-center">
                      <i className="bi bi-person-circle me-1"></i>
                      {displayName || session.user.username || 'User'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item className="text-muted">
                        <i className="bi bi-person me-2"></i>{session.user.username}
                      </Dropdown.Item>
                      <Dropdown.Item className="text-muted">
                        <i className="bi bi-shield me-2"></i>Role: {getRoleName(session.user.role)}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={handleLogout} className="text-danger">
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </li>
              </>
            ) : (
              <li className="nav-item mx-1">
                <Link href="/login" className="btn btn-sm px-3 text-center" style={{ backgroundColor: '#2E7D32', color: 'white' }}>
                  <i className="bi bi-box-arrow-in-right me-1"></i> Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;