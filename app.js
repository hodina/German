const KEY = 'german_words';
let quizQueue = [];
let current = null;

function load() {
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

function save(w) {
  localStorage.setItem(KEY, JSON.stringify(w));
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  if (id === 'list') renderList();
}

function addWords() {
  const lines = document.getElementById('wordInput').value.split('\n');
  const words = load();

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    let german, english;
    if (line.includes('=')) {
      [german, english] = line.split('=').map(x => x.trim());
    } else {
      german = line;
      english = '(add translation later)';
    }

    if (!words.find(w => w.german === german)) {
      words.push({ german, english, rank: 0 });
    }
  });

  save(words);
  document.getElementById('wordInput').value = '';
  alert('Words added');
}

function renderList() {
  const filter = document.getElementById('search').value.toLowerCase();
  const words = load().sort((a,b)=>a.german.localeCompare(b.german));
  const tbody = document.getElementById('wordTable');
  tbody.innerHTML = '';

  words.filter(w =>
    w.german.toLowerCase().includes(filter) ||
    w.english.toLowerCase().includes(filter)
  ).forEach(w => {
    tbody.innerHTML += `<tr><td>${w.german}</td><td>${w.english}</td><td>${w.rank}</td></tr>`;
  });
}

function weighted(words) {
  return words.flatMap(w => Array(w.rank >=5 ? 1 : w.rank >=3 ? 3 : 6).fill(w));
}

function startQuiz() {
  const words = load();
  if (words.length < 3) return alert('Need at least 3 words');

  quizQueue = Array.from({length: document.getElementById('questionCount').value},
    ()=> weighted(words)[Math.floor(Math.random()*weighted(words).length)]
  );

  document.getElementById('quizBox').classList.remove('hidden');
  next();
}

function next() {
  if (!quizQueue.length) {
    alert('Finished');
    document.getElementById('quizBox').classList.add('hidden');
    return;
  }

  current = quizQueue.shift();
  document.getElementById('question').innerText = current.german;

  const words = load().filter(w=>w.german!==current.german).sort(()=>0.5-Math.random()).slice(0,2);
  const opts = [...words.map(w=>w.english), current.english].sort(()=>0.5-Math.random());

  const box = document.getElementById('options');
  box.innerHTML = '';
  opts.forEach(o=>{
    const b=document.createElement('button');
    b.innerText=o;
    b.onclick=()=>answer(o);
    box.appendChild(b);
  });
}

function answer(a) {
  const words = load();
  const w = words.find(x=>x.german===current.german);
  if (a===current.english) w.rank++;
  else w.rank=Math.max(0,w.rank-1);
  save(words);
  next();
}

showPage('add');
