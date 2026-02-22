const statusCards = [
  { label: 'Applied', value: 16 },
  { label: 'Interview', value: 6 },
  { label: 'Offer', value: 2 },
  { label: 'Rejected', value: 7 }
];

const monthly = [
  ['2026-01', 5],
  ['2026-02', 8],
  ['2026-03', 6]
];

export const App = () => (
  <main className="container">
    <h1>Job Application Tracker</h1>
    <p className="subtitle">SaaS dashboard snapshot</p>
    <section className="grid">
      {statusCards.map((card) => (
        <article key={card.label} className="card">
          <h3>{card.label}</h3>
          <p>{card.value}</p>
        </article>
      ))}
    </section>
    <section className="card analytics">
      <h2>Monthly Applications</h2>
      <ul>
        {monthly.map(([month, count]) => (
          <li key={month}>
            <span>{month}</span>
            <strong>{count}</strong>
          </li>
        ))}
      </ul>
    </section>
  </main>
);
