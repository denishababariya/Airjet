import { useState, useEffect, useCallback } from 'react';
import { warrantiesApi } from './api';
import { getErrorMessage } from './errorMessages';

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
      setError(getErrorMessage(err, 'Unable to load warranties. Please try again.'));
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
