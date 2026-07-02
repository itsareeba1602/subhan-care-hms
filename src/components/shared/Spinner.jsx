import { Loader2 } from 'lucide-react';
import './Spinner.css';

function Spinner({ size = 32, label }) {
  return (
    <div className="spinner-wrapper">
      <Loader2 className="spinner-icon" size={size} />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
}

export default Spinner;
