import React, { useState } from 'react';
import { MdDashboard, MdMonetizationOn, MdList, MdAssessment, MdSettings } from 'react-icons/md';
import PayrollDashboard from './payroll/PayrollDashboard';
import SalaryGeneration from './payroll/SalaryGeneration';
import SalaryList from './payroll/SalaryList';
import SalaryDetails from './payroll/SalaryDetails';
import SalaryEdit from './payroll/SalaryEdit';
import Payslip from './payroll/Payslip';
import PayrollReports from './payroll/PayrollReports';
import Allowances from './payroll/Allowances';
import Deductions from './payroll/Deductions';

const Payroll = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSalaryId, setSelectedSalaryId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'details', 'edit', 'payslip'

  const handleViewSalary = (id) => {
    setSelectedSalaryId(id);
    setViewMode('details');
  };

  const handleEditSalary = (id) => {
    setSelectedSalaryId(id);
    setViewMode('edit');
  };

  const handleViewPayslip = (id) => {
    setSelectedSalaryId(id);
    setViewMode('payslip');
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedSalaryId(null);
  };

  const handleSalarySaved = () => {
    setViewMode('list');
    setSelectedSalaryId(null);
  };

  const renderContent = () => {
    // Handle sub-page navigation for Salary List
    if (activeTab === 'salary-list') {
      if (viewMode === 'details' && selectedSalaryId) {
        return <SalaryDetails salaryId={selectedSalaryId} onBack={handleBack} onEdit={handleEditSalary} />;
      }
      if (viewMode === 'edit' && selectedSalaryId) {
        return <SalaryEdit salaryId={selectedSalaryId} onBack={handleBack} onSave={handleSalarySaved} />;
      }
      if (viewMode === 'payslip' && selectedSalaryId) {
        return <Payslip salaryId={selectedSalaryId} onBack={handleBack} />;
      }
      return <SalaryList onViewDetails={handleViewSalary} onEdit={handleEditSalary} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <PayrollDashboard />;
      case 'salary-generation':
        return <SalaryGeneration onViewSalary={handleViewSalary} onEdit={handleEditSalary} />;
      case 'salary-list':
        return <SalaryList onViewDetails={handleViewSalary} onEdit={handleEditSalary} />;
      case 'reports':
        return <PayrollReports />;
      case 'allowances':
        return <Allowances />;
      case 'deductions':
        return <Deductions />;
      default:
        return <PayrollDashboard />;
    }
  };

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Payroll Management</div>
          <div className="d_page_subtitle">Complete salary and payroll management system</div>
        </div>
      </div>

      <div className="d_tabs mb-3">
        {[
          ['dashboard', 'Dashboard', MdDashboard],
          ['salary-generation', 'Salary Generation', MdMonetizationOn],
          ['salary-list', 'Salary List', MdList],
          ['reports', 'Reports', MdAssessment],
          ['allowances', 'Allowances', MdSettings],
          ['deductions', 'Deductions', MdSettings]
        ].map(([key, label, Icon]) => (
          <button 
            key={key} 
            className={`d_tab_btn ${activeTab === key ? 'd_active' : ''}`} 
            onClick={() => {
              setActiveTab(key);
              setViewMode('list');
              setSelectedSalaryId(null);
            }}
          >
            <Icon style={{ marginRight: '0.5rem' }} />
            {label}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
};

export default Payroll;