const express = require('express');
const cors = require('cors');
const app = express();


// Allow requests from Next.js
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ message: 'Backend is connected!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));