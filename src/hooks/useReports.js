import { useState } from 'react';
import * as reportService from '../services/reportService';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function useReports(initialType = 'registrations') {
  const [reportType, setReportType] = useState(initialType);
  const [dateFrom, setDateFrom] = useState(daysAgoISO(30));
  const [dateTo, setDateTo] = useState(todayISO());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await reportService.generateReport(reportType, { dateFrom, dateTo });
      setReport(result);
    } catch (err) {
      setError(err.message || 'Failed to generate report.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    reportType,
    setReportType,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    report,
    loading,
    error,
    generate,
  };
}
