import React, { useState, useRef, useEffect } from 'react';
import {
  MdNotifications, MdSearch, MdFullscreen, MdSettings,
  MdPerson, MdLogout, MdKeyboardArrowDown,
} from 'react-icons/md';

const Navbar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen, activeMenu, setActiveMenu }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isDesktop = window.innerWidth >= 992;

  const handleHamburger = () => {
    if (isDesktop) {
      setCollapsed(prev => !prev);
    } else {
      setMobileOpen(prev => !prev);
    }
  };

  const pageLabel = activeMenu
    ? activeMenu.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Dashboard';

  return (
    <header className="d_navbar">
      {/* Hamburger */}
      <button
        className={`d_hamburger ${mobileOpen ? 'd_ham_open' : ''}`}
        onClick={handleHamburger}
        aria-label="Toggle sidebar"
      >
        <span className="d_ham_bar" />
        <span className="d_ham_bar" />
        <span className="d_ham_bar" />
      </button>

      {/* Page title / breadcrumb */}
      <div>
        <div className="d_navbar_title">{pageLabel}</div>
        <div className="d_navbar_breadcrumb">
          Home <MdKeyboardArrowDown style={{ rotate: '-90deg' }} />
          <span>{pageLabel}</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="d_navbar_actions">
        {/* Search */}
        <button className="d_nav_action_btn" aria-label="Search">
          <MdSearch />
        </button>

        {/* Fullscreen */}
        <button
          className="d_nav_action_btn d-none d-md-flex"
          aria-label="Fullscreen"
          onClick={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
          }}
        >
          <MdFullscreen />
        </button>

        {/* Notifications */}
        <button className="d_nav_action_btn" aria-label="Notifications">
          <MdNotifications />
          <span className="d_notif_badge">3</span>
        </button>

        {/* Profile */}
        <div className="d_profile_wrap" ref={profileRef}>
          <button
            className="d_profile_btn"
            onClick={() => setProfileOpen(prev => !prev)}
            aria-label="Profile menu"
          >
            <div className="d_profile_avatar">SA</div>
            <div>
              <div className="d_profile_name">Super Admin</div>
              <div className="d_profile_role">Administrator</div>
            </div>
            <MdKeyboardArrowDown style={{ color: 'var(--d-text-muted)', fontSize: 16 }} />
          </button>

          {profileOpen && (
            <div className="d_profile_dropdown">
              <div
                className="d_dropdown_item"
                onClick={() => {
                  setActiveMenu('My Profile');
                  setProfileOpen(false);
                }}
                style={{ cursor: 'pointer' }}
              >
                <MdPerson /> My Profile
              </div>
              <div
                className="d_dropdown_item"
                onClick={() => {
                  setActiveMenu('Settings');
                  setProfileOpen(false);
                }}
                style={{ cursor: 'pointer' }}
              >
                <MdSettings /> Settings
              </div>
              <div className="d_dropdown_divider" />
              <div
                className="d_dropdown_item d_logout"
                onClick={() => {
                  if (window.confirm('Are you sure you want to logout?')) {
                    setActiveMenu('Login');
                    setProfileOpen(false);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <MdLogout /> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
