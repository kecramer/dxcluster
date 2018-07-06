K3AM's DXCluster for NPM
=========

A lightweight utility to connect to a DXCluster server and emit spot events along with the data from the spot in JSON format.

This is my first NPM package, and I'm relatively new to Javascript. As I learn, breaking changes are not only possible, but likely. If you have feedback, I would love to hear it.

## Installation

  `npm install dxcluster`

## Usage

If you have never logged into a specific DXCluster before, you should do that in an  interactive telnet session first. The `write` method is provided such that a user could authenticate the first time themselves, but it will be easier to do in a shell. This package listens for `Please enter your call:` before providing your callsign for authentication.

    conn = new DXCluster()

    let opts = {
      host: 'dxusa.net',
      port: 7300,
      loginPrompt: 'login:',
      call: 'K3AM'
    }

    conn.connect(opts)
      .then(() => {
        console.log('connected')
      })
      .catch((err) => {
        console.log(err);
      })

    conn.on('spot', (spot) => {
      console.log(spot);
    })


  When a spot is detected (by watching for `DX de`), a spot event is triggered, and the spot details are passed in an object that looks like this:

    { spotter: 'KK4CB',
      spotted: 'N7EME',
      frequency: 50313,
      message: 'FM07FK<>DM34',
      when: 2018-07-06T03:03:35.280Z }

## Tests

  Tests are coming soon.

## Contributing

This is my first (any only, as of 7/5/18) npm module. Send me PRs or comments. I'm here to learn!
