const express = require('express');
const router = express.Router();
const Store = require('../lib/store');
const Parser = require('../lib/parser');
const { v4: uuidv4 } = require('uuid');

const store = new Store('./data/state.json');
const parser = new Parser(process.env.OPENAI_API_KEY);


// Simple API Key Auth
const API_KEY = process.env.API_KEY || "12345";

router.use((req, res, next) => {
  const key = req.headers["x-api-key"];
  if (key !== API_KEY) {
    return res.status(401).json({ status: "error", message: "Invalid API Key" });
  }
  next();
});


// POST /api/process  <-- SpeakSpace will call this
router.post('/process', async (req, res) => {
  try {
    const payload = req.body || {};
    const prompt = payload.prompt || payload.text || '';
    const noteId = payload.note_id || uuidv4();
    console.log("Incoming prompt:", prompt);


    if (!prompt) {
      return res.status(400).json({ status: 'error', message: 'No prompt provided' });
    }

    // parse intent (device/room/action/params)
    const parsed = await parser.parse(prompt);

    // apply actions (supports multiple commands)
    const actions = Array.isArray(parsed.actions) ? parsed.actions : [parsed];

    const results = [];
    for (const action of actions) {
      const result = store.applyAction(action);
      results.push(result);
    }

    // return new state and history id
    return res.json({
      status: 'success',
      message: 'Workflow executed',
      note_id: noteId,
      parsed,
      results,
      state: store.getState()
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error', error: err.message });
  }
});

// GET current state
router.get('/state', (req, res) => {
  res.json({ status: 'success', state: store.getState() });
});

// GET history
router.get('/history', (req, res) => {
  res.json({ status: 'success', history: store.getHistory() });
});

module.exports = router;
