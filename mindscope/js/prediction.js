/* Multi-step assessment + real call to the FastAPI backend. No fake scores anywhere. */
(function () {
  const API_URL = 'https://mind-matrix-hnir.onrender.com/predict';
  const COUNTRIES = ['India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France','Brazil','China','Japan','South Korea','Russia','Italy','Spain','Netherlands','Sweden','Norway','Denmark','Switzerland','Ireland','Pakistan','Bangladesh','Nepal','Sri Lanka','Indonesia','Malaysia','Singapore','Thailand','Vietnam','Philippines','Egypt','Nigeria','Kenya','South Africa','Argentina','Chile','Colombia','Peru','Poland','Portugal','Greece','Ukraine','Israel','UAE','Saudi Arabia','New Zealand'].sort();
  const PLATFORMS = ['Facebook','LinkedIn','Instagram','Snapchat','Twitter','YouTube','TikTok','LINE','KakaoTalk','VKontakte','WhatsApp','WeChat'];

  // Field config: keys match the backend model exactly.
  const STEPS = [
    { name: 'You', title: 'About you', desc: 'Basic details, so the model knows who it is looking at.', fields: [
      { k: 'Age', t: 'range', label: 'Age', hint: 'In years', min: 0, max: 100, step: 1, val: 20, int: true },
      { k: 'Gender', t: 'cards', label: 'Gender', opts: ['Male', 'Female'] },
      { k: 'Country', t: 'combo', label: 'Country', hint: 'Pick from the list or type your own', opts: COUNTRIES } ] },
    { name: 'Study', title: 'Your studies', desc: 'Where you are in school and how much time you give it.', fields: [
      { k: 'Academic_Level', t: 'cards', label: 'Academic level', opts: ['High School', 'Undergraduate', 'Graduate'] },
      { k: 'Study_Hours', t: 'range', label: 'Study hours per day', hint: 'Typical day', min: 0, max: 24, step: .5, val: 4, unit: 'h' } ] },
    { name: 'Social', title: 'Social media', desc: 'How you spend time on your phone.', fields: [
      { k: 'Most_Used_Platform', t: 'cards', chips: true, label: 'Most used platform', opts: PLATFORMS },
      { k: 'Purpose_Of_Use', t: 'cards', label: 'Main purpose', opts: ['Networking', 'Education', 'Entertainment', 'News'] },
      { k: 'Avg_Daily_Usage_Hours', t: 'range', label: 'Daily usage', hint: 'Average hours per day', min: 0, max: 24, step: .5, val: 4, unit: 'h' },
      { k: 'Daily_Unlocks', t: 'range', label: 'Phone unlocks per day', hint: 'Whole number, 0 or more', min: 0, max: 300, step: 1, val: 60, int: true, open: true } ] },
    { name: 'Life', title: 'Daily life', desc: 'Movement, rest and how stressed you feel.', fields: [
      { k: 'Physical_Activity_Hours', t: 'range', label: 'Physical activity', hint: 'Hours per day', min: 0, max: 24, step: .5, val: 1, unit: 'h' },
      { k: 'Sleep_Hours_Per_Night', t: 'range', label: 'Sleep', hint: 'Hours per night', min: 0, max: 24, step: .5, val: 7, unit: 'h' },
      { k: 'Stress_Level', t: 'cards', label: 'Stress level', opts: ['Low', 'Medium', 'High', 'Very High'] } ] }
  ];
  const FIELDS = STEPS.flatMap(s => s.fields);
  const $ = id => document.getElementById(id);
  const state = {}; let step = 0;

  function reset() {
    FIELDS.forEach(f => state[f.k] = f.t === 'range' ? f.val : '');
    step = 0; build(); show(0);
  }

  // ---- Rendering ----
  function build() {
    $('steps').innerHTML = ''; $('progress').innerHTML = '';
    STEPS.forEach((s, i) => {
      const d = document.createElement('div'); d.textContent = s.name; $('progress').append(d);
      const sec = document.createElement('section'); sec.className = 'step'; sec.hidden = true;
      sec.innerHTML = `<h3>${s.title}</h3><p>${s.desc}</p>`;
      s.fields.forEach(f => sec.append(field(f)));
      $('steps').append(sec);
    });
  }
  function field(f) {
    const w = document.createElement('div'); w.className = 'field';
    w.innerHTML = `<div class="lbl">${f.label}<span class="val"></span></div>${f.hint ? `<small>${f.hint}</small>` : '<small></small>'}`;
    const val = w.querySelector('.val');
    if (f.t === 'range') {
      const r = document.createElement('div'); r.className = 'rng';
      r.innerHTML = `<input type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${state[f.k]}" aria-label="${f.label}"><input class="num" type="number" min="${f.min}" ${f.open ? '' : `max="${f.max}"`} step="${f.step}" value="${state[f.k]}" aria-label="${f.label} value">`;
      const [sl, nu] = r.querySelectorAll('input');
      const paint = () => { sl.style.setProperty('--p', ((Math.min(+sl.value, f.max) - f.min) / (f.max - f.min) * 100) + '%'); val.textContent = (nu.value === '' ? '–' : nu.value) + (f.unit ? ' ' + f.unit : ''); };
      sl.oninput = () => { nu.value = sl.value; state[f.k] = +sl.value; paint(); };
      nu.oninput = () => { state[f.k] = nu.value === '' ? NaN : +nu.value; if (nu.value !== '') sl.value = nu.value; paint(); };
      w.append(r); paint();
    } else if (f.t === 'cards') {
      const g = document.createElement('div'); g.className = 'cards' + (f.chips ? ' chips' : '');
      f.opts.forEach(o => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'card'; b.textContent = o;
        b.setAttribute('aria-pressed', state[f.k] === o);
        b.onclick = () => { state[f.k] = o; g.querySelectorAll('.card').forEach(x => x.setAttribute('aria-pressed', x === b)); val.textContent = o; hideErr(); };
        g.append(b);
      });
      w.append(g); val.textContent = state[f.k];
    } else { // combo: custom dropdown that also accepts free text
      const c = document.createElement('div'); c.className = 'combo';
      c.innerHTML = '<input type="text" autocomplete="off" placeholder="e.g. India" aria-label="Country"><ul hidden></ul>';
      const inp = c.querySelector('input'), ul = c.querySelector('ul');
      const list = () => { const q = inp.value.trim().toLowerCase(); const m = f.opts.filter(o => o.toLowerCase().includes(q)).slice(0, 30);
        ul.innerHTML = m.map(o => `<li role="option">${o}</li>`).join(''); ul.hidden = !m.length; };
      inp.oninput = () => { state[f.k] = inp.value.trim(); list(); };
      inp.onfocus = list;
      ul.onmousedown = e => { if (e.target.tagName === 'LI') { inp.value = state[f.k] = e.target.textContent; ul.hidden = true; } };
      inp.onblur = () => setTimeout(() => ul.hidden = true, 120);
      w.append(c);
    }
    return w;
  }
  function show(i) {
    step = i;
    document.querySelectorAll('.step').forEach((s, n) => { s.hidden = n !== i; if (n === i) Anim.stepIn(s); });
    [...$('progress').children].forEach((d, n) => d.className = n < i ? 'done' : n === i ? 'on' : '');
    $('backBtn').style.visibility = i ? 'visible' : 'hidden';
    $('nextBtn').firstElementChild.textContent = i === STEPS.length - 1 ? 'Get my score' : 'Continue';
    hideErr();
  }

  // ---- Validation ----
  function validate(fields) {
    for (const f of fields) {
      const v = state[f.k];
      if (f.t === 'range') {
        if (typeof v !== 'number' || !isFinite(v)) return `Enter a number for “${f.label}”.`;
        if (v < f.min || (!f.open && v > f.max)) return `“${f.label}” must be between ${f.min} and ${f.max}.`;
        if (f.int && !Number.isInteger(v)) return `“${f.label}” must be a whole number.`;
      } else if (!String(v).trim()) return `Choose an option for “${f.label}”.`;
    }
    return '';
  }
  const showErr = m => { $('stepError').textContent = m; $('stepError').hidden = false; };
  const hideErr = () => $('stepError').hidden = true;

  // ---- Backend call ----
  function payload() { // exactly the 12 backend properties
    return { Age: Math.trunc(state.Age), Gender: state.Gender, Country: String(state.Country).trim(), Academic_Level: state.Academic_Level,
      Most_Used_Platform: state.Most_Used_Platform, Purpose_Of_Use: state.Purpose_Of_Use, Avg_Daily_Usage_Hours: +state.Avg_Daily_Usage_Hours,
      Daily_Unlocks: Math.trunc(state.Daily_Unlocks), Study_Hours: +state.Study_Hours, Physical_Activity_Hours: +state.Physical_Activity_Hours,
      Sleep_Hours_Per_Night: +state.Sleep_Hours_Per_Night, Stress_Level: state.Stress_Level };
  }
  async function submit() {
    const bad = validate(FIELDS); if (bad) return showErr(bad);
    const body = payload(), ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 20000);
    $('loader').hidden = false;
    try {
      const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
      if (res.status === 422) { // FastAPI validation error
        const j = await res.json().catch(() => ({}));
        const d = Array.isArray(j.detail) ? j.detail.map(x => `${(x.loc || []).slice(1).join('.')}: ${x.msg}`).join('; ') : 'The server rejected the input.';
        throw new Error('Invalid input — ' + d);
      }
      if (!res.ok) throw new Error(`The prediction server returned an error (HTTP ${res.status}). Check the backend terminal for the traceback.`);
      const data = await res.json();
      const score = data.prediction_Mental_Health_Score;
      if (typeof score !== 'number' || !isFinite(score)) throw new Error('The server replied, but the response had no valid prediction_Mental_Health_Score.');
      showResult(score, body);
    } catch (e) {
      showErr(e.name === 'AbortError' ? 'The server took too long to respond. Try again.'
        : e instanceof TypeError ? 'Could not reach the prediction server at ' + API_URL + '. Make sure the FastAPI backend is running, then try again.' : e.message);
    } finally { clearTimeout(timer); $('loader').hidden = true; }
  }

  function showResult(score, sent) {
    $('summary').innerHTML = Object.entries(sent).map(([k, v]) => `<li>${k.replace(/_/g, ' ')}: <b>${v}</b></li>`).join('');
    $('result').hidden = false; $('scoreNum').textContent = '0.00';
    $('result').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { Anim.revealResult($('result')); Anim.countUp($('scoreNum'), score, 2); }, 500);
  }

  $('backBtn').onclick = () => show(step - 1);
  $('nextBtn').onclick = () => {
    const bad = validate(STEPS[step].fields); if (bad) return showErr(bad);
    step < STEPS.length - 1 ? show(step + 1) : submit();
  };
  $('form').onsubmit = e => e.preventDefault();
  $('retake').onclick = () => { $('result').hidden = true; reset(); $('assess').scrollIntoView({ behavior: 'smooth' }); };
  reset();
})();
