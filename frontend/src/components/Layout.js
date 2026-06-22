import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children, activeMenu, setActiveMenu }) => {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop,  setIsDesktop]  = useState(window.innerWidth >= 992);

  // Track viewport resize
  useEffect(() => {
    const onResize = () => {
      const desktop = window.innerWidth >= 992;
      setIsDesktop(desktop);
      if (desktop) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll (via class) when mobile sidebar open
  useEffect(() => {
    if (!isDesktop && mobileOpen) {
      document.body.classList.add('d_sidebar_open');
    } else {
      document.body.classList.remove('d_sidebar_open');
    }
    return () => document.body.classList.remove('d_sidebar_open');
  }, [mobileOpen, isDesktop]);

  const mainClass = [
    'd_main',
    (isDesktop && collapsed) ? 'd_collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="d_wrapper">
      {/* Mobile overlay */}
      {!isDesktop && (
        <div
          className={`d_overlay ${mobileOpen ? 'd_show' : ''}`}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={isDesktop ? collapsed : false}
        mobileOpen={mobileOpen}
        activeMenu={activeMenu}
        setActiveMenu={(menu) => {
          setActiveMenu(menu);
          if (!isDesktop) setMobileOpen(false);
        }}
      />

      {/* Main — fixed height column: navbar + scrollable content + footer */}
      <div className={mainClass}>
        {/* Sticky top navbar */}
        <Navbar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          activeMenu={activeMenu}
        />

        {/* Scrollable content area — ONLY this scrolls vertically */}
        <main className="d_content">
          {children}
        </main>

        {/* Sticky bottom footer */}
        <footer className="d_footer">
          &copy; {new Date().getFullYear()} <strong>Airjet ERP</strong> — Spare Parts Management System. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Layout;
