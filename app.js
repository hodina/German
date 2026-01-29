const STORAGE_KEY = "german_words";
let quizQueue = [];
let current = null;

function loadWords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveWords(words) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

async function addWords() {
  const input = document.getElementById("wordInput").value.trim();
  if (!input) return;

  const lines = input.split("\n").map(l => l.trim()).filter(Boolean);
  const words = loadWords();

  for (const german of lines) {
    if (words.find(w => w.german === german)) continue;
    const english = await translateGerman(german);
    words.push({ german, english, rank: 0 });
  }

  saveWords(words);
  document.getElementById("wordInput").value = "";
  alert("Words added!");
}

async function translateGerman(text) {
  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "de",
        target: "en"
      })
    });
    const data = await res.json();
    return data.translatedText;
  } catch {
    return "(translation failed)";
  }
}

function weightedPool(words) {
  return words.flatMap(w => {
    const weight = w.rank >= 5 ? 1 : w.rank >= 3 ? 3 : 6;
    return Array(weight).fill(w);
  });
}

function startQuiz() {
  const words = loadWords();
  if (words.length < 3) {
    alert("Add at least 3 words.");
    return;
  }

  const count = parseInt(document.getElementById("questionCount").value);
  const pool = weightedPool(words);

  quizQueue = Array.from({ length: count }, () =>
    pool[Math.floor(Math.random() * pool.length)]
  );

  document.getElementById("quiz").classList.remove("hidden");
  nextQuestion();
}

function nextQuestion() {
  if (quizQueue.length === 0) {
    alert("Quiz finished!");
    document.getElementById("quiz").classList.add("hidden");
    return;
  }

  current = quizQueue.shift();
  document.getElementById("question").innerText = current.german;

  const words = loadWords();
  const wrong = words
    .filter(w => w.german !== current.german)
    .sort(() => 0.5 - Math.random())
    .slice(0, 2);

  const options = [...wrong.map(w => w.english), current.english]
    .sort(() => 0.5 - Math.random());

  const container = document.getElementById("options");
  container.innerHTML = "";

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => answer(opt);
    container.appendChild(btn);
  });
}

function answer(selected) {
  const words = loadWords();
  const word = words.find(w => w.german === current.german);

  if (selected === current.english) {
    word.rank++;
  } else {
    word.rank = Math.max(0, word.rank - 1);
  }

  saveWords(words);
  nextQuestion();
}
