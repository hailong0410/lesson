const API = 'http://localhost:4000/api';

// Helpers
function showOutput(el, html) { el.innerHTML = html; }
function showError(el, msg) { el.innerHTML = `<p class="error">Lỗi: ${msg}</p>`; }

// 1. Lesson plan
document.getElementById('lesson-btn').onclick = async () => {
  const out = document.getElementById('lesson-output');
  const topic = document.getElementById('lesson-topic').value.trim();
  const grade = document.getElementById('lesson-grade').value;
  const duration = Number(document.getElementById('lesson-duration').value);

  showOutput(out, '<em>Đang tạo giáo án…</em>');

  try {
    const res = await fetch(`${API}/lesson-plan`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ topic, grade, duration })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    showOutput(out, `<pre>${data.plan}</pre>`);
  } catch (err) {
    showError(out, err.message);
  }
};


// 2. Generate test
document.getElementById('test-btn').onclick = async () => {
  const out = document.getElementById('test-output');
  const topicsRaw = document.getElementById('test-topics').value.trim();
  const topics = topicsRaw
    ? topicsRaw.split('\n').map(s=>s.trim()).filter(Boolean)
    : [];
  const grade = document.getElementById('test-grade').value;
  const type = document.getElementById('test-type').value;
  const bloom = Array.from(document.querySelectorAll('.bloom:checked'))
                  .map(cb=>cb.value);

  showOutput(out, '<em>Đang tạo đề kiểm tra…</em>');

  try {
    const res = await fetch(`${API}/generate-test`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ topics, grade, type, bloomLevels: bloom })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    showOutput(out, `<pre>${data.test}</pre>`);
  } catch (err) {
    showError(out, err.message);
  }
};


// 3. Evaluation & report
document.getElementById('eval-btn').onclick = async () => {
  const out = document.getElementById('eval-output');
  const namesRaw = document.getElementById('eval-names').value.trim();
  const scoresRaw = document.getElementById('eval-scores').value.trim();
  const names = namesRaw.split('\n').map(s=>s.trim()).filter(Boolean);
  const scoresList = scoresRaw.split('\n').map(line=>{
    const [n, sc] = line.split('|').map(s=>s.trim());
    return { name: n, score: Number(sc) };
  });

  showOutput(out, '<em>Đang phân tích & báo cáo…</em>');

  try {
    const res = await fetch(`${API}/evaluate`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ names, scores: scoresList })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    showOutput(out, `<pre>${data.report}</pre>`);
  } catch (err) {
    showError(out, err.message);
  }
};
