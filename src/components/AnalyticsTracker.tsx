import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { capturarRef } from '../lib/afiliado';

export default function AnalyticsTracker() {
  useAnalytics();
  const { search } = useLocation();
  // ?ref=NZ-XXXXX de um link compartilhado: guarda 30 dias e registra o
  // clique. Roda em toda navegação porque o link pode apontar para qualquer
  // página (produto, loja, home).
  useEffect(() => {
    capturarRef(search);
  }, [search]);
  return null;
}
