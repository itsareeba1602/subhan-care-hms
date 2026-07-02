import './Card.css';

function Card({ children, className = '', noPadding = false, ...rest }) {
  return (
    <div className={`card ${noPadding ? 'card-no-padding' : ''} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export default Card;
