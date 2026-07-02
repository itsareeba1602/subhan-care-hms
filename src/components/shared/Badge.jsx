import './Badge.css';

// tone: 'primary' | 'secondary' | 'danger' | 'neutral'
function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export default Badge;
