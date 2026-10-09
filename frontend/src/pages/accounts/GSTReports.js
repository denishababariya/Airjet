import React, { useState, useEffect, useRef } from 'react';
import { MdDownload, MdVisibility, MdReceiptLong, MdAdd, MdEdit, MdDelete, MdRefresh } from 'react-icons/md';
import html2pdf from 'html2pdf.js';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ToastContainer from '../../components/Toast';
import useToast from '../../hooks/useToast';
import useConfirm from '../../hooks/useConfirm';
import { gstApi } from '../../utils/api';
import { V, validate } from '../../utils/validators';
import { getErrorMessage } from '../../utils/errorMessages';

const blank = { month: '', taxable: '', cgst: '', sgst: '', igst: '', total: '', status: 'Pending' };
const toNum = (v) => parseFloat(String(v||'').replace(/[^\d.]/g,'')) || 0;
const fmt   = (v) => `₹${toNum(v).toLocaleString('en-IN')}`;
const tabs  = ['GSTR-1', 'GSTR-3B', 'GSTR-2A'];

export default function GSTReports() {
  const [activeTab, setActiveTab] = useState('GSTR-1');
  const reportRef = useRef(null);
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(blank);
  const [editId, setEditId]       = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);

  const { toasts, toast, removeToast }         = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await gstApi.getAll();
      setRecords(res.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to load GST records. Please refresh.'));
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchRecords(); }, []);

  const totalTaxable = records.reduce((s,r) => s + toNum(r.taxable), 0);
  const totalCgst    = records.reduce((s,r) => s + toNum(r.cgst),    0);
  const totalSgst    = records.reduce((s,r) => s + toNum(r.sgst),    0);
  const totalIgst    = records.reduce((s,r) => s + toNum(r.igst),    0);
  const totalTax     = records.reduce((s,r) => s + toNum(r.total),   0);
  const filedCount   = records.filter(r => r.status === 'Filed').length;

  const downloadPDF = () => {
    if (!reportRef.current) return;
    const opt = {
      margin: [8, 6],
      filename: `gst_${activeTab.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    };
    html2pdf().set(opt).from(reportRef.current).save();
  };

  const openAdd = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (row) => {
    setForm({
      month: row.month||'', taxable: row.taxable!=null ? String(row.taxable) : '',
      cgst:  row.cgst!=null  ? String(row.cgst)  : '',
      sgst:  row.sgst!=null  ? String(row.sgst)  : '',
      igst:  row.igst!=null  ? String(row.igst)  : '',
      total: row.total!=null ? String(row.total) : '',
      status: row.status||'Pending',
    });
    setEditId(row._id); setErrors({}); setModal(true);
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => {
      const val = e.target.value;
      setForm(p => {
        const next = { ...p, [field]: val };
        if (['cgst','sgst','igst'].includes(field)) {
          const c = toNum(field==='cgst' ? val : next.cgst);
          const s = toNum(field==='sgst' ? val : next.sgst);
          const i = toNum(field==='igst' ? val : next.igst);
          next.total = String(c + s + i);
        }
        return next;
      });
      setErrors(p => ({ ...p, [field]: '' }));
    },
  });

  const Err = ({ field }) => errors[field] ? <span className="d_field_error">{errors[field]}</span> : null;

  const doValidate = () => validate({
    month:   V.gstPeriod(form.month),
    taxable: V.amount(form.taxable, 'Taxable amount'),
    cgst:    form.cgst    ? V.optionalAmount(form.cgst,    'CGST') : '',
    sgst:    form.sgst    ? V.optionalAmount(form.sgst,    'SGST') : '',
    igst:    form.igst    ? V.optionalAmount(form.igst,    'IGST') : '',
  });

  const handleSave = async () => {
    const e = doValidate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = {
        month: form.month.trim(), taxable: toNum(form.taxable),
        cgst: toNum(form.cgst), sgst: toNum(form.sgst),
        igst: toNum(form.igst), total: toNum(form.total),
        status: form.status,
      };
      if (editId) await gstApi.update(editId, payload);
      else        await gstApi.create(payload);
      setModal(false);
      toast.success(editId ? 'GST record updated!' : 'GST record added!');
      fetchRecords();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to save GST record. Please try again.'));
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    confirm({
      title: 'Delete GST Record', message: 'Delete this GST record? This cannot be undone.',
      confirmLabel: 'Delete', variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try { await gstApi.remove(id); toast.success('GST record deleted.'); fetchRecords(); }
        catch (err) { toast.error(getErrorMessage(err, 'Unable to delete GST record. Please try again.')); }
      },
    });
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog {...confirmState} onCancel={closeConfirm} />

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div><div className="d_page_title">GST Reports</div><div className="d_page_subtitle">GST filing status and tax summary reports</div></div>
        <div className="d-flex gap-2">
          <button className="d_btn d_btn_outline d_btn_sm" onClick={fetchRecords}><MdRefresh /></button>
          <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add GST Record</button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {[
          { label:'Total Taxable', value:fmt(totalTaxable), color:'var(--d-primary)' },
          { label:'Total CGST',    value:fmt(totalCgst),    color:'var(--d-info)' },
          { label:'Total SGST',    value:fmt(totalSgst),    color:'var(--d-info)' },
          { label:'Total IGST',    value:fmt(totalIgst),    color:'var(--d-warning)' },
          { label:'Total Tax',     value:fmt(totalTax),     color:'var(--d-danger)' },
          { label:'Filed Periods', value:`${filedCount} / ${records.length}`, color:'var(--d-success)' },
        ].map((c,i) => (
          <div key={i} className="col-6 col-md-4 col-xl-2">
            <div className="d_stat_card" style={{ borderLeftColor:c.color }}>
              <div className="d_stat_value" style={{ color:c.color, fontSize:18 }}>{c.value}</div>
              <div className="d_stat_label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="d_card" ref={reportRef}>
        <div className="d_card_header">
          <div className="d_tabs">{tabs.map(t => <button key={t} className={`d_tab_btn${activeTab===t?' d_active':''}`} onClick={() => setActiveTab(t)}>{t}</button>)}</div>
          <h2 className="d_card_title" style={{ marginLeft:'auto' }}><MdReceiptLong className="d_card_icon" />{records.length} record{records.length!==1?'s':''}</h2>
        </div>
        <div className="d_card_body p-0">
          {loading ? <div className="text-center py-4">Loading GST records…</div> : activeTab === 'GSTR-1' ? (
            <div className="d_table_wrap"><table className="d_table" style={{ minWidth:820 }}>
              <thead><tr><th>#</th><th>Period</th><th>Taxable (₹)</th><th>CGST (₹)</th><th>SGST (₹)</th><th>IGST (₹)</th><th>Total Tax (₹)</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {records.length === 0 && <tr className="d_empty"><td colSpan={9} className="text-center py-4">No GST records found. Click "Add GST Record" to get started.</td></tr>}
                {records.map((r,i) => (
                  <tr key={r._id}>
                    <td>{i+1}</td><td><strong>{r.month}</strong></td>
                    <td>{fmt(r.taxable)}</td><td>{fmt(r.cgst)}</td><td>{fmt(r.sgst)}</td><td>{fmt(r.igst)}</td>
                    <td><strong>{fmt(r.total)}</strong></td>
                    <td><span className={`d_badge ${r.status==='Filed'?'d_success':r.status==='Overdue'?'d_danger':'d_warning'}`}>{r.status}</span></td>
                    <td><div className="d_action_btns">
                      <button className="d_icon_btn d_view"  title="View"     onClick={() => openEdit(r)}><MdVisibility /></button>
                      <button className="d_icon_btn d_edit"  title="Edit"     onClick={() => openEdit(r)}><MdEdit /></button>
                      <button className="d_icon_btn"          title="Download PDF" onClick={downloadPDF}><MdDownload /></button>
                      <button className="d_icon_btn d_del"   title="Delete"   onClick={() => handleDelete(r._id)}><MdDelete /></button>
                    </div></td>
                  </tr>
                ))}
                {records.length > 0 && (
                  <tr style={{ fontWeight:700, background:'var(--d-light)' }}>
                    <td colSpan={2} style={{ textAlign:'right' }}>Totals</td>
                    <td>{fmt(totalTaxable)}</td><td>{fmt(totalCgst)}</td><td>{fmt(totalSgst)}</td><td>{fmt(totalIgst)}</td>
                    <td><strong>{fmt(totalTax)}</strong></td><td colSpan={2} />
                  </tr>
                )}
              </tbody>
            </table></div>
          ) : (
            <div className="d_alert d_info m-3">
              <MdReceiptLong style={{ fontSize:18, flexShrink:0 }} />
              <span>{activeTab} data is sourced from GSTR-1 records above. Sync with the GST portal to view auto-populated data.</span>
            </div>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit GST Record' : 'Add GST Record'} size="md">
        <div className="d_form_group mb-3">
          <label className="d_form_label">Period / Month <span className="d_req">*</span></label>
          <input className="d_form_control" placeholder="e.g. Jun 2026" {...f('month')} />
          <Err field="month" />
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Taxable Amount (₹) <span className="d_req">*</span></label>
            <input type="number" className="d_form_control" min={0} placeholder="e.g. 1000000" {...f('taxable')} />
            <Err field="taxable" />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}><option>Pending</option><option>Filed</option><option>Overdue</option></select>
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group"><label className="d_form_label">CGST (₹)</label><input type="number" className="d_form_control" min={0} placeholder="e.g. 90000" {...f('cgst')} /><Err field="cgst" /></div>
          <div className="d_form_group"><label className="d_form_label">SGST (₹)</label><input type="number" className="d_form_control" min={0} placeholder="e.g. 90000" {...f('sgst')} /><Err field="sgst" /></div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group"><label className="d_form_label">IGST (₹)</label><input type="number" className="d_form_control" min={0} placeholder="e.g. 0"      {...f('igst')} /><Err field="igst" /></div>
          <div className="d_form_group">
            <label className="d_form_label">Total Tax (₹) <span style={{ fontSize:11, color:'var(--d-text-muted)' }}>(auto)</span></label>
            <input type="number" className="d_form_control" min={0} style={{ background:'var(--d-light)' }} {...f('total')} />
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update Record' : 'Save Record'}</button>
        </div>
      </Modal>
    </div>
  );
}
