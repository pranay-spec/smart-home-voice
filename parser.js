const fetch = require('node-fetch');

class Parser {
  constructor(openaiKey) {
    this.openaiKey = openaiKey;
  }

  async parse(text) {
    // try rule-based first
    const rule = this.ruleParse(text);
    if (rule) return rule;

    // fallback to AI if key present
    if (this.openaiKey) {
      try {
        const ai = await this.aiParse(text);
        return ai;
      } catch (e) {
        console.warn('AI parse failed, returning rule result fallback', e.message);
        return { actions: [], raw: text };
      }
    }

    return { actions: [], raw: text };
  }

  ruleParse(text) {
    const t = text.toLowerCase();

    // split into multiple commands by ' and ' or ';'
    const parts = t.split(/(?:;|\band\b)/).map(s => s.trim()).filter(Boolean);
    const actions = parts.map(p => this._parseSingle(p)).filter(Boolean);
    if (actions.length) return { actions, raw: text };
    return null;
  }

  _parseSingle(p) {
    // room detection
    const rooms = ['bedroom','living room','living_room','kitchen','hall'];
    let room = rooms.find(r => p.includes(r)) || (p.includes('bedroom') ? 'bedroom' : null);
    if (!room) {
      // try generic words
      if (p.includes('living')) room = 'living_room';
      else room = 'living_room'; // default to living_room for demo
    }

    // device detection
    let device = null;
    if (p.includes('ac') || p.includes('air conditioner')) device = 'ac';
    else if (p.includes('light') || p.includes('lamp')) device = 'light';
    else if (p.includes('tv')) device = 'tv';
    else if (p.includes('fan')) device = 'fan';
    else device = 'light'; // default

    // actions
    if (p.match(/turn (on|off)/)) {
      const on = !!p.match(/turn on|switch on|switch the .*on/);
      return { room, device, action: on ? 'turn_on' : 'turn_off', params: {}, raw: p };
    }

// Detect temperature (example: 24, 25, 18 degrees)
const tempMatch = p.match(/(\d{2})\s?(?:°c|c|degrees|degree)?/);
if (tempMatch && (p.includes('set') || p.includes('to'))) {
  const temp = parseInt(tempMatch[1], 10);
  return {
    room,
    device: 'ac',
    action: 'set_temp',
    params: { temp },
    raw: p
  };
}


    const brightnessMatch = p.match(/(\d{1,3})\s?%/);
    if (p.includes('dim') || p.includes('brightness') || brightnessMatch) {
      const b = brightnessMatch ? parseInt(brightnessMatch[1],10) : 50;
      return { room, device: 'light', action: 'set_brightness', params: { brightness: b }, raw: p };
    }

    const channelMatch = p.match(/channel\s?(\d{1,3})/);
    if (channelMatch) {
      return { room, device: 'tv', action: 'set_channel', params: { channel: parseInt(channelMatch[1],10) }, raw: p };
    }

    // fallback: attempted on/off detection
    if (p.includes('on')) return { room, device, action: 'turn_on', params: {}, raw: p };
    if (p.includes('off')) return { room, device, action: 'turn_off', params: {}, raw: p };

    return null;
  }

  async aiParse(text) {
    // optional: use OpenAI to extract structured JSON. Keep prompt simple.
    const prompt = `Extract smart-home commands from this text and output a JSON array named actions where each action has room, device, action, params. Text: """${text}""".
Example output:
{"actions":[{"room":"bedroom","device":"ac","action":"set_temp","params":{"temp":24}}]}`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // user may replace with available model
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 250
      })
    });
    const j = await resp.json();
    const textOut = j?.choices?.[0]?.message?.content || j?.choices?.[0]?.text || '';
    try {
      // try to parse JSON from the textOut
      const m = textOut.match(/\{[\s\S]*\}/);
      const json = m ? JSON.parse(m[0]) : JSON.parse(textOut);
      return json;
    } catch (e) {
      return { actions: [], raw: text, ai_raw: textOut };
    }
  }
}

module.exports = Parser;
