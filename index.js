const net = require('net')
const events = require('events')

module.exports = class DXCluster extends events.EventEmitter {
  constructor(opts = {}) {
    super()

    this.socket = opts.socket || null
    this.call = opts.call || null
    this.status = {
      connected: false,
      awaiting_login: false,
    }
    this.regex = {
      callsign: /[0-9]?[A-Z]{1,2}[0-9]{1,3}[A-Z]{1,4}/g,
      frequency: /[0-9]{1,5}\.[0-9]{1,3}/g,
      time: /[0-9]{4}Z/g
    }
    this.ct = opts.ct || '\n'
    this.dxId = opts.dxId || 'DX de'
  }

  connect(opts = {}) {
    return new Promise((resolve, reject) => {
      let call = opts.call || this.call
      if(!call) {
        reject('You must specify a callsign')
        return;
      }

      this.host = opts.host || '127.0.0.1'
      this.port = opts.port || 23

      this.socket = net.createConnection({
        host: this.host || 'w6cua.no-ip.org',
        port: this.port || 7300
      }, () => {
        this.status.connected = this.status.awaiting_login = true
        resolve(this.socket);
      })

      let loginPrompt = opts.loginPrompt || 'Please enter your call:'

      this.socket.on('data', (data) => {
        if(this.status.awaiting_login) {
          if(data.toString('utf8').indexOf(loginPrompt) != -1) {
            if(this.write(call)) {
              this.status.awaiting_login = false
            }
          }
        }
        this._parseDX(data.toString('utf8'))
      })

      this.socket.on('close', (err) => {
        this.status.connected = this.status.awaiting_login = false;
        this.emit('close');
      })

      this.socket.on('timeout', () => {
        this.emit('timeout')
      })
    })
  }

  close() {
    this.status.connected = this.status.awaiting_login = false;
    this.socket = this.socket.end()
    this.emit('closed')
  }

  destroy() {
    this.status.connected = this.status.awaiting_login = false;
    this.socket = this.socket.destroy()
    this.emit('destroyed')
  }

  write(str) {
    return this.socket.write(str + this.ct)
  }

  _parseDX(dxString) {
    let dxSpot = { }
    if(dxString.indexOf(this.dxId) == 0) {
      let callsigns = dxString.match(this.regex.callsign)
      let frequency = parseFloat(dxString.match(this.regex.frequency)[0])
      if(callsigns.length < 2 || !frequency) {
        this.emit('parseerror', dxString)
        return;
      }
      dxSpot = {
        spotter: callsigns[0],
        spotted: callsigns[1],
        frequency,
        message: dxString.substring(
                    /*start*/ dxString.indexOf(callsigns[1]) + callsigns[1].length,
                    /* end */ dxString.search(this.regex.time))
                    .trim(),
        when: new Date()
      }
      this.emit('spot', dxSpot)
    } else {
      this.emit('message', dxString)
    }
  }
}
