// lesson-backend/server.js

require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const { execSync } = require('child_process');
const path         = require('path');
const { OpenAI }   = require('openai');

const app = express();

// 1) Middleware cơ bản
app.use(cors());
app.use(express.json());

// 2) Serve static files từ public/
app.use(express.static(path.join(__dirname, 'public')));

// 3) Khởi OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 4) Helper gọi retriever.py
function retrieveChunks(topic, k = 5) {
  const safe = topic.replace(/"/g, '\\"');
  const cmd  = `python "${path.join(__dirname, 'retriever.py')}" "${safe}" ${k}`;
  const out  = execSync(cmd, { encoding: 'utf-8' });
  return JSON.parse(out);
}

// 5) API soạn giáo án
app.post('/api/lesson-plan', async (req, res) => {
  const { topic, grade, duration } = req.body;
  let chunks = [];
  try { chunks = retrieveChunks(topic, 5); }
  catch { chunks = []; }

  const contextText = chunks.length
    ? '\n\nDựa vào các đoạn tài liệu sau:\n' +
      chunks.map(c => c.text).join('\n\n')
    : '';

  const prompt = `
Bạn là trợ lý soạn giáo án Lịch sử chi tiết. Nếu phần trả về bị cắt, hãy tiếp tục từ nơi dừng mà không lặp lại.
Chủ đề: ${topic || 'GPT tự chọn chủ đề lịch sử phù hợp'}
Cấp học: ${grade}
Thời lượng: ${duration} phút
${contextText}

Hãy xuất giáo án theo mẫu:
I. Mục tiêu
II. Chuẩn bị
III. Tiến trình
IV. Đánh giá
`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Bạn là trợ lý soạn giáo án Lịch sử chi tiết.' },
        { role: 'user',   content: prompt }
      ],
      max_tokens: 1200
    });
    res.json({ plan: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 6) API tạo đề kiểm tra
app.post('/api/generate-test', async (req, res) => {
  const { topics, grade, type, bloomLevels } = req.body;
  const topicText = topics?.length
    ? topics.join(', ')
    : 'GPT tự chọn các chủ đề phù hợp';
  const bloomText = bloomLevels?.length
    ? bloomLevels.join(', ')
    : 'tất cả mức Bloom';

  const prompt = `
Bạn là trợ lý tạo đề kiểm tra Lịch sử.
Chủ đề: ${topicText}
Cấp học: ${grade}
Loại kiểm tra: ${type}
Phân loại Bloom: ${bloomText}

Yêu cầu:
- Tạo 24 câu trắc nghiệm khách quan (4 lựa chọn ABCD).
- Tạo 8 câu đúng/sai.
- Chia đều % câu cho các mức Bloom (nếu có).
- Cuối đề xuất phần đáp án: liệt kê câu số – đáp án ABCD hoặc Đ/S.
- Xuất dưới dạng plain text, đánh số liên tục.
`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Bạn là trợ lý tạo đề kiểm tra Lịch sử.' },
        { role: 'user',   content: prompt }
      ],
      max_tokens: 2000
    });
    res.json({ test: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 7) API đánh giá học sinh
app.post('/api/evaluate', async (req, res) => {
  const { names, scores } = req.body;
  const nameList  = names.join(', ');
  const scoreList = scores.map(s => `${s.name}|${s.score}`).join(', ');

  const prompt = `
Bạn là trợ lý phân tích kết quả kiểm tra và báo cáo tiến độ học sinh.
Danh sách học sinh: ${nameList}
Điểm số: ${scoreList}

Yêu cầu:
- Cho mỗi học sinh: nhận xét điểm mạnh, điểm yếu.
- Phân loại mức độ (Giỏi, Khá, Trung bình, Yếu).
- Gợi ý phương pháp cải thiện cho từng học sinh.
- Xuất thành báo cáo ngắn gọn, mỗi học sinh 1 đoạn.
`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Bạn là trợ lý phân tích & báo cáo học sinh.' },
        { role: 'user',   content: prompt }
      ],
      max_tokens: 800
    });
    res.json({ report: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 8) Catch-all route để phục vụ index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 9) Khởi server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
