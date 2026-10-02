import React, { useState, useEffect, useRef } from 'react';
import { MdDownload, MdPictureAsPdf, MdTableChart, MdClose } from 'react-icons/md';
import html2pdf from 'html2pdf.js';

/**
 * Reusable export menu — PDF + JSON only.
 *
 * Props:
 *   label      : button text                     (default 'Export Report')
 *   filename   : base name without extension     (default 'report')
 *   data       : JSON-serialisable payload; null disables both actions
 *   targetRef  : ref (or element) captured for the PDF; falls back to .d_content
 *   orientation: 'portrait' | 'landscape'        (default 'landscape')
 *   disabled   : disables the trigger button
 *   className  : extra class for the trigger button
 */
const ExportMenu = ({
  label = 'Export Report',
  filename = 'report',
  data = null,
  targetRef = null,
  orientation = 'landscape',
  disabled = false,
  className = 'd_btn d_btn_outline',
}) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const hasData = data !== null && data !== undefined;
  const isDisabled = disabled || !hasData;

  const downloadBlob = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    setOpen(false);
    if (isDisabled) return;

    const target =
      (targetRef && (targetRef.current || targetRef)) ||
      document.querySelector('.d_content');

    if (!target) return;

    setBusy(true);
    const opt = {
      margin: [8, 6],
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation },
    };

    html2pdf().set(opt).from(target).save().finally(() => setBusy(false));
  };

  const exportJSON = () => {
    setOpen(false);
    if (isDisabled) return;
    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      `${filename}.json`,
    );
  };

  return (
    <div className="d_menu_wrap" ref={wrapRef}>
      <button
        type="button"
        className={className}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled || busy}
      >
        <MdDownload /> {busy ? 'Exporting…' : label}
      </button>

      {open && (
        <div className="d_menu_dropdown" role="menu">
          <div
            className={`d_dropdown_item${hasData ? '' : ' d_disabled'}`}
            role="menuitem"
            onClick={() => hasData && exportPDF()}
          >
            <MdPictureAsPdf /> Download PDF
          </div>
          <div
            className={`d_dropdown_item${hasData ? '' : ' d_disabled'}`}
            role="menuitem"
            onClick={() => hasData && exportJSON()}
          >
            <MdTableChart /> Download JSON
          </div>
          <div className="d_dropdown_divider" />
          <div className="d_dropdown_item" role="menuitem" onClick={() => setOpen(false)}>
            <MdClose /> Close
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;