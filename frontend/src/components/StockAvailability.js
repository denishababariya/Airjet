import React from 'react';
import { MdInventory, MdCheck, MdClose } from 'react-icons/md';

const StockAvailability = ({ items, spareParts }) => {
    const checkAvailability = () => {
        return items.map(item => {
            const part = spareParts.find(s => s._id === item.sparePart);
            return {
                sparePartId: item.sparePart,
                partNumber: part?.partNumber,
                partName: part?.partName,
                requiredQty: item.quantity,
                availableQty: part?.quantity || 0,
                isAvailable: (part?.quantity || 0) >= item.quantity,
                shortage: Math.max(0, item.quantity - (part?.quantity || 0))
            };
        });
    };

    const stockData = checkAvailability();
    const allAvailable = stockData.every(item => item.isAvailable);

    if (items.length === 0) {
        return (
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <MdInventory style={{ fontSize: '2em', color: '#999', marginBottom: '10px' }} />
                <p style={{ margin: 0, color: '#666' }}>No items to check</p>
            </div>
        );
    }

    return (
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <MdInventory style={{ marginRight: '10px', fontSize: '1.2em' }} />
                <h4 style={{ margin: 0 }}>Stock Availability</h4>
                <span 
                    className={`d_badge ${allAvailable ? 'd_success' : 'd_danger'}`}
                    style={{ marginLeft: 'auto' }}
                >
                    {allAvailable ? 'All Available' : 'Shortage'}
                </span>
            </div>
            <table className="d_table" style={{ marginTop: '10px' }}>
                <thead>
                    <tr>
                        <th>Part</th>
                        <th>Required</th>
                        <th>Available</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {stockData.map((item, index) => (
                        <tr key={index}>
                            <td>
                                <div>{item.partNumber}</div>
                                <div style={{ fontSize: '0.85em', color: '#666' }}>{item.partName}</div>
                            </td>
                            <td>{item.requiredQty}</td>
                            <td style={{ color: item.isAvailable ? 'var(--d-success)' : 'var(--d-danger)', fontWeight: 'bold' }}>
                                {item.availableQty}
                            </td>
                            <td>
                                {item.isAvailable ? (
                                    <span className="d_badge d_success">
                                        <MdCheck style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                        Available
                                    </span>
                                ) : (
                                    <span className="d_badge d_danger">
                                        <MdClose style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                        Shortage ({item.shortage})
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {!allAvailable && (
                <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
                    <strong style={{ color: '#856404' }}>Warning:</strong> Some items are out of stock. Please adjust quantities or restock before proceeding.
                </div>
            )}
        </div>
    );
};

export default StockAvailability;
