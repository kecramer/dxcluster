const net = require('net')
const events = require('events')

module.exports = class DXCluster extends events.EventEmitter {
  constructor(call = null, socket = null) {
    super();

    this.socket = socket
    this.call = call
    this.status = {
      connected: false,
      awaiting_login: false,
    }
    this.regex = {
      callsign: /[0-9]?[A-Z]{1,2}[0-9]{1,3}[A-Z]{1,4}/g,
      frequency: /[0-9]{1,5}\.[0-9]{1,3}/g,
      time: /[0-9]{4}Z/g
    }
    this.ct = '\n'
  }

  setCallsign(call) {
    this.call = call;
  }

  connect(host, port) {
    return new Promise((resolve, reject) => {
      if(!this.call) {
        reject('You must specify a callsign')
        return;
      }

      this.host = host;
      this.port = port;

      this.socket = net.createConnection({
        port: this.port || 7300,
        host: this.host || 'w6cua.no-ip.org'
      }, () => {
        this.status.connected = this.status.awaiting_login = true
        resolve(this.socket);
      })

      this.socket.on('data', (data) => {
        if(this.status.awaiting_login) {
          if(data.toString('utf8').indexOf('Please enter your call:') != -1) {
            if(this.socket.write(this.call + this.ct)) {
              this.status.awaiting_login = false
            }
          }
        }
        this._parseDX(data.toString('utf8'))
      })
    })
  }

  close() {
    this.status.connected = this.status.awaiting_login = false;
    this.socket = this.socket.end();
    this.emit('closed')
  }

  destory() {
    this.status.connected = this.status.awaiting_login = false;
    this.socket = this.socket.destroy();
    this.emit('destroyed')
  }

  write(str) {
    this.socket.write(str + this.ct);
  }

  _parseDX(dxString) {
    let dxSpot = { }
    if(dxString.indexOf('DX de') == 0) {
      let callsigns = dxString.match(this.regex.callsign);
      if(callsigns.length < 2) {
        console.log(dxString);
      }
      dxSpot = {
        spotter: callsigns[0],
        spotted: callsigns[1],
        frequency: parseFloat(dxString.match(this.regex.frequency)[0]),
        message: dxString.substring(
                    /*start*/ dxString.indexOf(callsigns[1]) + callsigns[1].length,
                    /* end */ dxString.search(this.regex.time))
                    .trim(),
        when: new Date()
      }
      this.emit('spot', dxSpot)
    }
  }
}
