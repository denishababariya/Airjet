import React from 'react';

const GSTCalculation = ({ items, customerState, onGSTChange }) => {
    const calculateGST = (taxableAmount, gstRate, isInterState) => {
        const totalGST = (taxableAmount * gstRate) / 100;
        
        if (isInterState) {
            return {
                cgstAmount: 0,
                sgstAmount: 0,
                igstAmount: totalGST
            };
        } else {
            const halfGST = totalGST / 2;
            return {
                cgstAmount: halfGST,
                sgstAmount: halfGST,
                igstAmount: 0
            };
        }
    };

    const isInterState = customerState !== 'Gujarat';

    let subtotal = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    items.forEach(item => {
        const grossAmount = item.quantity * item.rate;
        const discount = item.discount || 0;
        const itemTaxableAmount = grossAmount - discount;
        
        const gstCalc = calculateGST(itemTaxableAmount, item.gstRate || 18, isInterState);

        subtotal += grossAmount;
        totalDiscount += discount;
        taxableAmount += itemTaxableAmount;
        totalCGST += gstCalc.cgstAmount;
        totalSGST += gstCalc.sgstAmount;
        totalIGST += gstCalc.igstAmount;
    });

    const grandTotal = taxableAmount + totalCGST + totalSGST + totalIGST;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    if (onGSTChange) {
        onGSTChange({
            subtotal,
            totalDiscount,
            taxableAmount,
            cgst: totalCGST,
            sgst: totalSGST,
            igst: totalIGST,
            grandTotal
        });
    }

    return (
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '15px', marginTop: 0 }}>GST Calculation</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Subtotal:</span>
                <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Discount:</span>
                <strong>{formatCurrency(totalDiscount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Taxable Amount:</span>
                <strong>{formatCurrency(taxableAmount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>CGST:</span>
                <strong>{formatCurrency(totalCGST)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>SGST:</span>
                <strong>{formatCurrency(totalSGST)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>IGST:</span>
                <strong>{formatCurrency(totalIGST)}</strong>
            </div>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '1.1em', 
                borderTop: '1px solid #ddd', 
                paddingTop: '10px', 
                marginTop: '10px' 
            }}>
                <span>Grand Total:</span>
                <strong style={{ color: 'var(--d-primary)' }}>{formatCurrency(grandTotal)}</strong>
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.85em', color: '#666' }}>
                <strong>Tax Type:</strong> {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
            </div>
        </div>
    );
};

export default GSTCalculation;
