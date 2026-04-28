import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MainLayout() {
  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
      <Navbar />
      <main className="main-content" style={{ flexGrow: 1, backgroundColor: 'var(--bg-secondary)' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
