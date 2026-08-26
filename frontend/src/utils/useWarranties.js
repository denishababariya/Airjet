import { useState, useEffect, useCallback } from 'react';
import { warrantiesApi } from './api';

export function useWarranties() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: list } = await warrantiesApi.getAll();
      setData(list);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load warranties');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = async (payload, editId) => {
    if (editId) await warrantiesApi.update(editId, payload);
    else await warrantiesApi.create(payload);
    await fetchData();
  };

  const remove = async (id) => {
    await warrantiesApi.remove(id);
    await fetchData();
  };

  return { data, loading, error, setError, fetchData, save, remove };
}
