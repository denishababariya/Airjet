import React, { useState } from 'react';
import { MdBuildCircle } from 'react-icons/md';
import ServiceTickets from './service/ServiceTickets';
import EngineerAssignment from './service/EngineerAssignment';
import EngineerVisit from './service/EngineerVisit';
import SparePartsRequired from './service/SparePartsRequired';
import ServiceReports from './service/ServiceReports';

const Service = ({ defaultTab = 'tickets' }) => {
  const [tab, setTab] = useState(defaultTab);

  const TABS = [
    { key: 'tickets', label: 'Service Tickets', component: ServiceTickets },
    { key: 'assignment', label: 'Engineer Assignment', component: EngineerAssignment },
    { key: 'visit', label: 'Engineer Visit', component: EngineerVisit },
    { key: 'parts', label: 'Spare Parts', component: SparePartsRequired },
    { key: 'reports', label: 'Service Reports', component: ServiceReports },
  ];

  const ActiveComponent = TABS.find(t => t.key === tab)?.component || ServiceTickets;

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Service Management</h1>
          <p className="d_page_subtitle">Complete service workflow: Tickets → Assignment → Visit → Parts → Reports</p>
        </div>
      </div>

      <div className="d_tabs mb-3">
        {TABS.map(({ key, label }) => (
          <button 
            key={key} 
            className={`d_tab_btn ${tab === key ? 'd_active' : ''}`} 
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </div>
  );
};

export default Service;
