import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/shared/Sidebar';
import Navbar from '../components/shared/Navbar';
import './DashboardLayout.css';

function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="dash-layout">
      <div className={`dash-sidebar-wrap ${mobileNavOpen ? 'dash-sidebar-wrap-open' : ''}`}>
        <Sidebar />
      </div>
      {mobileNavOpen && (
        <div className="dash-sidebar-overlay" onClick={() => setMobileNavOpen(false)} />
      )}

      <div className="dash-main">
        <Navbar onMenuClick={() => setMobileNavOpen((prev) => !prev)} />
        <main className="dash-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
