import { Outlet } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileCartFab from '../components/MobileCartFab';
import CompetitionBanner from '../components/CompetitionBanner';
import CompetitionTicker from '../components/CompetitionTicker';
import BugReportModal from '../components/BugReportModal';

export default function MainLayout() {
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      setHeaderHeight(h);
      document.documentElement.style.setProperty('--header-total-height', `${h}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
      <div
        ref={headerRef}
        className="app-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 'var(--nav-z-index, 1000)',
        }}
      >
        <CompetitionBanner />
        <Navbar />
        <CompetitionTicker />
      </div>
      <main
        className="main-content"
        style={{
          flexGrow: 1,
          backgroundColor: 'var(--bg-secondary)',
          paddingTop: headerHeight ? `${headerHeight}px` : undefined,
        }}
      >
        <Outlet />
      </main>
      <Footer />
      <MobileCartFab />
      <BugReportModal />
    </div>
  );
}
