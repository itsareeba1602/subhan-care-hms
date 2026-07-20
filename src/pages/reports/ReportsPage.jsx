import { FileBarChart, Download, Printer } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Spinner from '../../components/shared/Spinner';
import EmptyState from '../../components/shared/EmptyState';
import { useReports } from '../../hooks/useReports';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { REPORT_TYPES, reportToCSV, downloadCSV } from '../../services/reportService';
import './ReportsPage.css';

// FR-09.1 (per RoleRoute gating in AppRoutes.jsx): Admin has full access to
// every report type. Section 9 also gives Billing Staff 'R (financial)' —
// read-only, and scoped to the Revenue report only, since patient
// registrations/appointments/inventory aren't "financial" and Billing
// Staff has no access to those modules anywhere else in the app either.
function ReportsPage() {
  const { user } = useAuth();
  const isBillingStaff = user?.role === ROLES.BILLING_STAFF;
  const visibleReportTypes = isBillingStaff ? REPORT_TYPES.filter((t) => t.key === 'revenue') : REPORT_TYPES;

  const {
    reportType, setReportType,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    report, loading, error, generate,
  } = useReports(isBillingStaff ? 'revenue' : 'registrations');

  const reportLabel = visibleReportTypes.find((r) => r.key === reportType)?.label || 'Report';
  // Inventory is a live snapshot, not a dated log — see reportService's
  // buildInventoryReport comment. Disabling the pickers here instead of
  // just ignoring them keeps that honest instead of implying a date filter
  // that silently does nothing.
  const isDateRangeApplicable = reportType !== 'inventory';

  const handleExportCSV = () => {
    if (!report) return;
    const csv = reportToCSV(report, reportLabel);
    downloadCSV(csv, `${reportType}-report-${dateTo || 'current'}.csv`);
  };

  const handlePrint = () => window.print();

  return (
    <div>
      <h1 className="page-title">Reports</h1>
      <p className="page-subtitle">
        {isBillingStaff
          ? 'View revenue and collections reports over a date range.'
          : 'Generate operational reports on patient registrations, appointments, revenue, and inventory over a date range.'}
      </p>

      <Card className="reports-controls no-print">
        <div className="reports-controls-row">
          <div className="reports-field">
            <label className="reports-label">Report Type</label>
            <select
              className="reports-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              disabled={isBillingStaff}
            >
              {visibleReportTypes.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="reports-field">
            <label className="reports-label">From</label>
            <input
              type="date"
              className="reports-date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={!isDateRangeApplicable}
            />
          </div>
          <div className="reports-field">
            <label className="reports-label">To</label>
            <input
              type="date"
              className="reports-date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              disabled={!isDateRangeApplicable}
            />
          </div>
          <Button onClick={generate} loading={loading}>
            <FileBarChart size={18} /> Generate
          </Button>
        </div>
        {!isDateRangeApplicable && (
          <p className="reports-hint">Inventory reflects current stock levels — the date range doesn't apply to this report.</p>
        )}
        {error && <p className="reports-error">{error}</p>}
      </Card>

      {loading && <Spinner label="Generating report..." />}

      {!loading && report && (
        <Card className="reports-output">
          <div className="reports-output-header no-print">
            <h2 className="reports-output-title">{reportLabel}</h2>
            <div className="reports-output-actions">
              <Button variant="outline" onClick={handleExportCSV}>
                <Download size={16} /> Export CSV
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer size={16} /> Print / PDF
              </Button>
            </div>
          </div>

          <div className="reports-print-header">
            <h2>{reportLabel}</h2>
            <p>
              {isDateRangeApplicable ? `${dateFrom} to ${dateTo}` : 'Current snapshot'} · Generated {new Date().toLocaleString('en-PK')}
            </p>
          </div>

          <div className="reports-summary">
            {report.summary.map((s) => (
              <div key={s.label} className="reports-summary-card">
                <span className="reports-summary-value">{s.value}</span>
                <span className="reports-summary-label">{s.label}</span>
              </div>
            ))}
          </div>

          {report.rows.length === 0 ? (
            <EmptyState icon={FileBarChart} title="No records in this range" message="Try widening the date range or choosing a different report type." />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    {report.columns.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {!loading && !report && !error && (
        <Card>
          <EmptyState icon={FileBarChart} title="No report generated yet" message="Choose a report type and date range, then click Generate." />
        </Card>
      )}
    </div>
  );
}

export default ReportsPage;
