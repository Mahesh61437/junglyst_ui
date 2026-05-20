import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileCartFab from '../components/MobileCartFab';
import CompetitionBanner from '../components/CompetitionBanner';
import CompetitionTicker from '../components/CompetitionTicker';

export default function MainLayout() {
  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
      <CompetitionBanner />
      <Navbar />
      <CompetitionTicker />
      <main className="main-content" style={{ flexGrow: 1, backgroundColor: 'var(--bg-secondary)' }}>
        <Outlet />
      </main>
      <Footer />
      <MobileCartFab />
    </div>
  );
}
