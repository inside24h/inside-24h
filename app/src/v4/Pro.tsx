// "Pro — coming soon": what stays free forever and what Pro will add. Nothing is sold yet.
const FREE = [
  'See any food or drink travel through your body, minute by minute',
  'Quick answers: sugar, hunger, sleep, driving, energy',
  'Your body, your city, your time of day',
  'Compare two foods and make videos to share',
];
const PRO = [
  ['📅', 'Your history', 'Everything you ate this week in one view, with your sugar and sleep day by day.'],
  ['👨‍👩‍👧', 'Family profiles', 'Separate bodies for you, your partner, your kids or your parents.'],
  ['🍲', 'Your own meals', 'Save your recipes and favourite meals and open them in one tap.'],
  ['⇄', 'Bigger comparisons', 'Compare up to four foods or whole meals at once.'],
  ['🎬', 'Clean videos', 'Videos without the Inside 24h mark, with your own name or logo.'],
  ['📄', 'Report for your doctor', 'A one-page PDF of a day or a week to take to your doctor or dietitian.'],
  ['⚡', 'First to get new foods', 'Early access to new foods, drinks and features.'],
];

export function Pro() {
  return (
    <div className="about pro">
      <div className="probadge">Coming soon · €8 / month</div>
      <p>Inside 24h stays free. <b>Pro</b> is for people who want to use it every day for themselves and their family.</p>
      <h3>Always free</h3>
      <ul className="profree">{FREE.map((f) => <li key={f}><span aria-hidden="true">✓ </span>{f}</li>)}</ul>
      <h3>Pro adds</h3>
      <div className="prolist">
        {PRO.map(([i, t, d]) => <div key={t} className="proitem"><span aria-hidden="true">{i}</span><span><b>{t}</b><em>{d}</em></span></div>)}
      </div>
      <p className="note">Not available yet. Follow @inside24h to hear when it launches.</p>
    </div>
  );
}
