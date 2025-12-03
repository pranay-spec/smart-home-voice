const fs = require('fs');

class Store {
  constructor(file) {
    this.file = file;
    this._ensureFile();
    this.state = this._read();
    this.history = this.state.__history || [];
    delete this.state.__history;
  }

  _ensureFile(){
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
    if (!fs.existsSync(this.file)) {
      const init = {
        bedroom: { ac: { status: 'off', temp: null }, light: { status: 'off', brightness: 100 } },
        living_room: { tv: { status: 'off', channel: null }, light: { status: 'off', brightness: 100 } },
        __history: []
      };
      fs.writeFileSync(this.file, JSON.stringify(init, null, 2));
    }
  }

  _read(){
    return JSON.parse(fs.readFileSync(this.file));
  }

  _write(){
    const dump = { ...this.state, __history: this.history };
    fs.writeFileSync(this.file, JSON.stringify(dump, null, 2));
  }

  getState(){
    return this.state;
  }

  getHistory(){
    return this.history;
  }

  // action: { room, device, action, params, raw }
  applyAction(action){
    const timestamp = new Date().toISOString();
    const { room, device, action: act, params = {}, raw } = action;

    if (!room || !device || !act) {
      const err = { ok: false, message: 'Invalid action: missing room/device/action', raw, timestamp };
      this.history.push(err); this._write(); return err;
    }

    const roomKey = room.replace(/\s+/g, '_').toLowerCase();
    if (!this.state[roomKey]) this.state[roomKey] = {};

    if (!this.state[roomKey][device]) {
      // create default device entry
      this.state[roomKey][device] = { status: 'off' };
    }

    const dev = this.state[roomKey][device];

    // handle basic actions
    if (act === 'turn_on') dev.status = 'on';
    else if (act === 'turn_off') dev.status = 'off';
    else if (act === 'set_temp') {
      dev.status = 'on';
      dev.temp = params.temp || dev.temp;
    }
    else if (act === 'set_brightness') {
      dev.status = 'on';
      dev.brightness = params.brightness || dev.brightness || 100;
    }
    else if (act === 'set_channel') {
      dev.status = 'on';
      dev.channel = params.channel || dev.channel;
    }
    else {
      // store generic param changes
      Object.assign(dev, params);
    }

    const result = { ok: true, room: roomKey, device, action: act, newState: dev, raw, timestamp };
    this.history.push(result);
    this._write();
    return result;
  }
}

module.exports = Store;
