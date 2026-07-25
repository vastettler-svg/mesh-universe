function Card({ children, className = "" }) {
  return <div className={`mesh-card ${className}`}>{children}</div>;
}

export default Card;