import InvoiceList from '../../components/billing/InvoiceList';

function BillingPage() {
  return (
    <div>
      <h1 className="page-title">Billing & Invoices</h1>
      <p className="page-subtitle">
        Generate invoices, track payments, and monitor outstanding balances.
      </p>
      <InvoiceList />
    </div>
  );
}

export default BillingPage;
