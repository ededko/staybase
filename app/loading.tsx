export default function Loading() {
  return <div className="page-loading" role="status" aria-label="Завантаження">
    <div className="loading-heading" />
    <div className="loading-grid">{Array.from({ length: 6 }, (_, index) => <div className="loading-card" key={index} />)}</div>
  </div>;
}
