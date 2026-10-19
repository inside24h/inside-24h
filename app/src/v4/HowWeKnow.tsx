// "How we know": the methodology page in plain English, plus the one-line disclaimer shown next to the estimates.
// It reuses the claims (with their levels and sources) that the evidence drawers already show.
import { ESPRESSO } from '../content/espresso';
import { FOOD_CLAIMS, foodSourceClaims } from '../content/food';
import { FOODS } from './food/parse';
import { SOURCES } from '../content/sources';
import { LEVEL_LABEL, type Claim } from '../content/types';
import { TIPS, tipSource } from '../content/tips';
import { ClaimRow } from '../ui/ClaimRow';
import './safety.css';

export const DISCLAIMER = 'Estimates for a typical healthy adult — not medical advice.';

export function Disclaimer({ onHow }: { onHow?: () => void }) {
  return <p className="disclaim">{DISCLAIMER}{onHow && <button onClick={onHow}>How we know</button>}</p>;
}

const claim = (id: string): Claim | undefined => FOOD_CLAIMS[id] ?? ESPRESSO.claims[id];

function Studies({ ids }: { ids: string[] }) {
  const list = ids.map(claim).filter((c): c is Claim => !!c);
  return (
    <details>
      <summary>The studies behind this ({list.length})</summary>
      <ul className="claims">{list.map((c) => <ClaimRow key={c.id} claim={c} />)}</ul>
    </details>
  );
}

export function HowWeKnow() {
  return (
    <div className="about method">
      <p>Inside 24h is a simulation built from published studies. Here is what it rests on, in plain words.</p>

      <h3>Not medical advice</h3>
      <p>Every number is an estimate for a typical healthy adult with your sex, age, height and weight. It is not a measurement of you. Don’t use it to diagnose, treat, dose medicine or decide whether you can drive. If you have diabetes, a heart, kidney or liver condition, are pregnant or take medication, ask your doctor.</p>

      <h3>How sure is each statement?</h3>
      {(['A', 'B', 'C', '?'] as const).map((l) => (
        <div key={l} className="lvrow"><i className={`lv lv-${l === '?' ? 'q' : l}`}>{l}</i>
          <span><b>{LEVEL_LABEL[l]}.</b> {{
            A: 'Consistent studies in people, or an official body such as EFSA, WHO or the American Heart Association.',
            B: 'Studies in people, but small ones or with big differences between people.',
            C: 'Our own calculation from published numbers. We show the math.',
            '?': 'Nobody has measured it yet. We say so instead of guessing.',
          }[l]}</span></div>
      ))}
      <p>Every step in the app has a “How do we know?” link that shows its level and the studies behind it.</p>

      <h3>The main models</h3>
      <ul className="models">
        <li><b>Stomach emptying.</b> Drinks leave fast (water: half in about 13 minutes); calories, fiber and solid food slow this down. A normal solid meal is about 69% still in the stomach after 1 hour, 24% after 2 hours and almost gone after 4. <em>Assumes</em> a healthy stomach and that you have it all at once.
          <Studies ids={['G1', 'GE1', 'GE12', 'GE5', 'GE13']} /></li>
        <li><b>Absorption and removal.</b> Caffeine spreads through your body water and the liver halves it about every 6 hours (2.5–10 h between people; faster in smokers, slower on the pill). Alcohol follows the Widmark formula: your liver removes it at a fixed speed (0.10–0.20 ‰ an hour for most people), asleep or awake, so after many drinks it can still be there the next morning or after more than 24 hours; we then say so and give the time. We assume you drink everything at once unless you pick “Over how long?”: then the servings are spread evenly (5 beers over 3 h = one every 36 minutes). Spreading lowers the peak but hardly moves the end, because the liver works at its fixed speed from the first sip. <em>Assumes</em> a healthy liver and kidneys and your typed weight.
          <Studies ids={['D5', 'M4', 'M6', 'M7', 'AL2', 'AL3', 'AL14', 'AL12', 'AL9']} /></li>
        <li><b>Blood sugar.</b> How high blood sugar rises follows the glycemic index times the carbohydrate (the glycemic load), anchored on measured results for a can of cola and a glucose drink. Foods without a measured glycemic index get no curve rather than a guess. “Blood sugar” always means the sugar in your blood, not the sugar in the food. Alcohol draws no curve of its own: it slows the liver’s sugar-making, which can lower blood sugar hours later after a long fast, heavy drinking, or with insulin or diabetes tablets. <em>Assumes</em> no diabetes and a normal fasting level. It is a typical response, not yours.
          <Studies ids={['DB3', 'GL1', 'GL4', 'GL7', 'AL10', 'AL11', 'AL15']} /></li>
      </ul>

      <h3>Ranges, not single numbers</h3>
      <p>Where people differ a lot, we show a range. Blood sugar: about 40% lower or higher than the typical curve (one standard deviation in the studies; the same meal can raise blood sugar twice as much in one person as in another). Blood alcohol: from 40% below to 50% above our estimate (Widmark estimates are off by 20–40%, and peaks in some people run higher still), shown in ‰, which is grams of alcohol per liter of blood. We never show a time when you are “safe to drive”.</p>
      <p>The traffic lights and health bars are our own simple scales (level C), built on the official categories that each panel names.</p>

      <h3>Next-step tips</h3>
      <ul className="tiplist">
        {Object.values(TIPS).map((t) => (
          <li key={t.key}>{t.text} <i className={`lv lv-${t.level === '?' ? 'q' : t.level}`} title={LEVEL_LABEL[t.level]}>{t.level}</i>
            <div className="src">{t.sources.map((id) => { const s = tipSource(id); return s ? <a key={id} href={s.url} target="_blank" rel="noreferrer">{s.cite}</a> : null; })}</div></li>
        ))}
      </ul>

      <h3>Data</h3>
      <p>Food values: <a href="https://fdc.nal.usda.gov/" target="_blank" rel="noreferrer">USDA FoodData Central</a> (SR Legacy). Glycemic index: international GI tables (Atkinson 2008). Everything else: the published studies linked on each statement.</p>
      <p>Where USDA does not match what is sold in Europe, we use the product label instead:</p>
      <ul className="claims">{FOODS.flatMap((f) => foodSourceClaims(f.id)).map((id) => FOOD_CLAIMS[id]).filter((c): c is Claim => !!c).map((c) => <ClaimRow key={c.id} claim={c} />)}</ul>
      <p>Anatomy: <a href={SOURCES.bodyparts3d.url} target="_blank" rel="noreferrer">BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International</a>.</p>
    </div>
  );
}
