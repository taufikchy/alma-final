// components/Footer.tsx

const Footer = () => {
  return (
    <footer className="footer-alma mt-auto py-4">
      <div className="container">
        <div className="row text-center g-4">
          <div className="col-12 col-md-4">
            <h5 className="footer-title mb-2">
              <img src="/logo.png" alt="ALMA Logo" style={{ height: '24px', marginRight: '8px' }} />
              <span className="text-alma-green fw-bold">ALMA</span>
            </h5>
            <p className="text-muted mb-0 small">
              Aplikasi Layanan Manajemen Antenatal untuk kesehatan ibu hamil yang lebih baik.
            </p>
          </div>
          <div className="col-12 col-md-4">
            <h6 className="footer-title mb-2">Kontak</h6>
            <p className="text-muted mb-1 small">
              <i className="bi bi-envelope me-2 text-alma-pink"></i>dininurahmatikasalam@gmail.com
            </p>
            <p className="text-muted mb-0 small">
              <i className="bi bi-telephone me-2 text-alma-pink"></i>+62 857 7843 0078
            </p>
          </div>
          <div className="col-12 col-md-4">
            <h6 className="footer-title mb-2">Tautan</h6>
            <p className="mb-1">
              <a href="/patient/educational-materials" className="text-decoration-none">
                <i className="bi bi-book me-1"></i>Materi Edukasi
              </a>
            </p>
            <p className="mb-0">
              <a href="/login" className="text-decoration-none">
                <i className="bi bi-box-arrow-in-right me-1"></i>Login
              </a>
            </p>
          </div>
        </div>
        <hr className="my-3" style={{ borderColor: '#E0E0E0' }} />
        <div className="text-center text-muted small">
          <p className="mb-0">&copy; {new Date().getFullYear()} ALMA - Aplikasi Layanan Manajemen Antenatal. Hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;