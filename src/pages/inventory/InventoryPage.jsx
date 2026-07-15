import InventoryList from '../../components/inventory/InventoryList';

function InventoryPage() {
  return (
    <div>
      <h1 className="page-title">Inventory Management</h1>
      <p className="page-subtitle">
        Track medicine and medical supply stock, monitor reorder levels, and flag items nearing expiry.
      </p>
      <InventoryList />
    </div>
  );
}

export default InventoryPage;
