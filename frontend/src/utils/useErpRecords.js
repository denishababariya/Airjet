import { useState, useEffect, useCallback } from 'react';
import { erpApi } from './api';

export function useErpRecords(module, recordType) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: list } = await erpApi.getAll(module, recordType);
      setData(list);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [module, recordType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = async (payload, editId) => {
    const body = { module, recordType, ...payload };
    if (editId) await erpApi.update(editId, body);
    else await erpApi.create(body);
    await fetchData();
  };

  const remove = async (id) => {
    await erpApi.remove(id);
    await fetchData();
  };

  return { data, loading, error, setError, fetchData, save, remove };
}
