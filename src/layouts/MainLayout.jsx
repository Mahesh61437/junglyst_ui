import { Outlet } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MobileCartFab from '../components/MobileCartFab';
import CompetitionBanner from '../components/CompetitionBanner';
import CompetitionTicker from '../components/CompetitionTicker';

const MOBILE_BREAKPOINT = 768;

export default function MainLayout() {
  const headerRef = useRef(null);
  const bannersRef = useRef(null);
  const navRef = useRef(null);

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  const [headerHeight, setHeaderHeight] = useState(0);
  const [bannersHeight, setBannersHeight] = useState(0);
  const [navHeight, setNavHeight] = useState(0);
  const [navFixed, setNavFixed] = useState(false);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  // Desktop: measure full header
  useEffect(() => {
    if (isMobile) return;
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
  }, [isMobile]);

  // Mobile: measure banners + nav, and pin nav once user scrolls past banners
  useEffect(() => {
    if (!isMobile) return;
    const banners = bannersRef.current;
    const nav = navRef.current;
    if (!nav) return;

    const measure = () => {
      const bh = banners ? banners.getBoundingClientRect().height : 0;
      const nh = nav.getBoundingClientRect().height;
      setBannersHeight(bh);
      setNavHeight(nh);
      document.documentElement.style.setProperty('--header-total-height', `${nh}px`);
    };
    measure();

    const onScroll = () => {
      const bh = banners ? banners.getBoundingClientRect().height : 0;
      setNavFixed(window.scrollY >= bh);
    };
    onScroll();

    const ro = new ResizeObserver(measure);
    if (banners) ro.observe(banners);
    ro.observe(nav);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll);
    };
  }, [isMobile]);

  if (isMobile) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
        {/* Banners scroll with the page on mobile */}
        <div ref={bannersRef}>
          <CompetitionBanner />
          <CompetitionTicker />
        </div>
        {/* Navbar: in-flow until user scrolls past the banners, then fixed */}
        <div
          ref={navRef}
          className="app-header"
          style={{
            position: navFixed ? 'fixed' : 'relative',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 'var(--nav-z-index, 1000)',
          }}
        >
          <Navbar />
        </div>
        {/* Spacer to prevent layout jump when nav switches to fixed */}
        {navFixed && <div style={{ height: navHeight }} aria-hidden="true" />}
        <main
          className="main-content"
          style={{
            flexGrow: 1,
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <Outlet />
        </main>
        <Footer />
        <MobileCartFab />
      </div>
    );
  }

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
    </div>
  );
}
