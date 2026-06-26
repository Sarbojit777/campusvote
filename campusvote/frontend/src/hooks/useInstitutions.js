import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';

export function useInstitutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/institutions')
      .then(({ data }) => setInstitutions(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load institutions'))
      .finally(() => setLoading(false));
  }, []);

  return { institutions, loading, error };
}
