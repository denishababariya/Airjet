import React, { useState } from 'react';
import { MdTrendingUp, MdTrendingDown, MdAccountBalance } from 'react-icons/md';

const income = [
  { label: 'Sales Revenue', value: 14572000 },
  { label: 'Service Income', value: 825000 },
  { label: 'Other Income', value: 142000 },
];

const expenses = [
  { label: 'Purchase / COGS', value: 8934000 },
  { label: 'Salaries & Wages', value: 2890000 },
  { label: 'Warehouse Rent', value: 540000 },
  { label: 'Utilities & Power', value: 182000 },
  { label: 'Travel & Conveyance', value: 96000 },
  { label: 'Other Expenses', value: 214000 },
];

const totalIncome = income.reduce((s, i) => s + i.value, 0);
const totalExpenses = expenses.reduce((s, e) => s + e.value, 0);
const netProfit = totalIncome - totalExpenses;

const PLRow = ({ label, value, bold, indent }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.55rem 0.5rem',
    borderBottom: '1px solid var(--d-border)',
    paddingLeft: indent ? '1.5rem' : '0.5rem',
    fontWeight: bold ? 700 : 400,
  }}>
    <span>{label}</span>
    <span style={{ color: bold ? 'var(--d-text)' : 'var(--d-text-muted)' }}>₹{value.toLocaleString('en-IN')}</span>
  </div>
);

export default function ProfitLoss() {
  const [period, setPeriod] = useState('FY 2025-26');

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Profit &amp; Loss Statement</div>
          <div className="d_page_subtitle">Financial performance summary — {period}</div>
        </div>
        <select className="d_btn d_btn_outline" value={period} onChange={e => setPeriod(e.target.value)}>
          <option>FY 2025-26</option>
          <option>FY 2024-25</option>
          <option>FY 2023-24</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title"><span className="d_card_icon"><MdTrendingUp /></span>Income</div>
          </div>
          <div className="d_card_body" style={{ padding: 0 }}>
            {income.map(i => <PLRow key={i.label} label={i.label} value={i.value} indent />)}
            <PLRow label="Total Income" value={totalIncome} bold />
          </div>
        </div>

        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title"><span className="d_card_icon"><MdTrendingDown /></span>Expenses</div>
          </div>
          <div className="d_card_body" style={{ padding: 0 }}>
            {expenses.map(e => <PLRow key={e.label} label={e.label} value={e.value} indent />)}
            <PLRow label="Total Expenses" value={totalExpenses} bold />
          </div>
        </div>
      </div>

      <div className="d_card" style={{ border: '2px solid var(--d-success)', background: 'var(--d-success-bg, #f0fdf4)' }}>
        <div className="d_card_header">
          <div className="d_card_title" style={{ color: 'var(--d-success)' }}>
            <span className="d_card_icon"><MdAccountBalance /></span>
            Net Profit — {period}
          </div>
        </div>
        <div className="d_card_body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.1rem', color: 'var(--d-text-muted)' }}>
            Total Income (₹{totalIncome.toLocaleString('en-IN')}) − Total Expenses (₹{totalExpenses.toLocaleString('en-IN')})
          </span>
          <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--d-success)' }}>
            ₹{netProfit.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}
