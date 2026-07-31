function MetricCard({ label, value, note, tone = "default" }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <p className="metric-card__label">{label}</p>
      <h3 className="metric-card__value">{value}</h3>
      {note ? <p className="metric-card__note">{note}</p> : null}
    </article>
  );
}

export default MetricCard;

