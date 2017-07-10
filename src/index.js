import Hls from 'hls.js'
import id3 from 'id3js'

class Main {
  constructor(source) {
    // Stream url piped through object
    this.source = source

    // Get player element from the DOM
    this.player       = document.querySelector('#player')

    // Get control elements from the DOM
    this.playButton   = document.querySelector('#play-button')
    this.stopButton   = document.querySelector('#stop-button')
    this.volumeSlider = document.querySelector('#volume')
    this.volumeUp     = document.querySelector('#volume-up')
    this.volumeDn     = document.querySelector('#volume-down')
    this.volumeRs     = document.querySelector('#volume-reset')
    this.volumeVl     = document.querySelector('#volume-value')
    this.stats        = document.querySelector('#player-status')
    this.users        = document.querySelector('#user-status')
    this.status       = document.querySelector('#status')
    this.posi         = document.querySelector('#position')
    this.id3output    = document.querySelector('#id3output')
  }

  adjustVolume(_direction) {
    if (_direction === 'up') {
      this.volumeSlider.stepUp()
    } else if (_direction === 'down'){
      this.volumeSlider.stepDown()
    } else {
      console.error('You need to pass either `up` or `down` as a string to control volume.')
    }
    this.player.volume = this.volumeSlider.value;
    this.volumeVl.innerHTML = (this.volumeSlider.value * 100).toFixed(0)
  }

  readId3Tags() {
    id3( 
      this.source,
      (error, tags) => {
        
        if (error) {
	  this.id3output.innerHTML = 'Could not generate id3 tags'
	  console.log(error)
	} else {
	  console.log(tags)
          this.id3output.innerHTML = JSON.stringify(tags, null, 2)
        }
      }
    )
  }

  init() {
    // Check if HLS is supported in the browser, or fail
    if (Hls.isSupported()) {
        let hls = new Hls()
        hls.loadSource(this.source)
        hls.attachMedia(this.player)
        hls.on(Hls.Events.MANIFEST_PARSED, (data) => {

        // Timer init for click/hold
        let intervalId   = 0

        // Controls
        this.playButton.onclick = () => { this.player.play(); this.status.innerHTML = "PLAYING" }
        this.stopButton.onclick = () => { this.player.pause(); this.status.innerHTML = "STOPPED" }

        this.volumeSlider.oninput = () => {
          this.player.volume = this.volumeSlider.value
          this.volumeVl.innerHTML = (this.volumeSlider.value * 100).toFixed(0)
        }

        this.volumeUp.onmousedown = () => {
          // on click
          this.adjustVolume('up')
          // on click & hold
          intervalId = setInterval(() => {
            this.adjustVolume('up')
          }, 100)
        }

        this.volumeDn.onmousedown = () => {
          // on click
          this.adjustVolume('down')
          // on click & hold
          intervalId = setInterval(() => {
            this.adjustVolume('down')
          }, 100)
        }

        this.volumeRs.onclick = () => {
          this.volumeSlider.value = 0.5;
          this.volumeVl.innerHTML = 50;
          this.player.volume = 0.5
        }

        this.volumeUp.onmouseup = () => {
          clearInterval(intervalId)
        }
        this.volumeDn.onmouseup = () => {
          clearInterval(intervalId)
        }

        // Fire when metadata changes
        hls.on(Hls.Events.FRAG_PARSING_METADATA, (event, data) => {
          let meta = JSON.stringify(data, null, 2)

	  this.readId3Tags()

          this.stats.innerHTML = "PLAYER METADATA\n===============\n\n" + meta
          //console.log('metadata changed')
          //console.log(data)
        })

        // Fire when userdata changes
        hls.on(Hls.Events.FRAG_PARSING_DATA, (event, data) => {

	  this.users.innerHTML = "USER DATA\n==================\n\n" + data.startPTS
          //this.users.innerHTML = "USER DATA\n=================\n\n" + JSON.stringify(data, null, 2) 
          //console.log('data changed')
          //console.log(data)
        })

        hls.on(Hls.Events.STREAM_STATE_TRANSITION, (event, data) => {
          let bufData = JSON.stringify(data, null, 2)
          this.posi.innerHTML = "STREAM STATE\n==================\n\n" + bufData
        })
      })

    } else {
      this.status.innerHTML = 'Sorry, HLS streaming is not supported in your browser.'
    }
  }
}

function changeStream(_url, _stream) {
  let __main__ = new Main(_url)
  let strm = document.querySelector('#stream')
  let stat = document.querySelector('#status')

  strm.innerHTML = _stream
  stat.innerHTML = 'STOPPED'
  __main__.init()
}

window.onload = (event) => {

  // Get global buttons
  let ckat = document.querySelector('#ckat')
  let ckfx = document.querySelector('#ckfx')
  let chur = document.querySelector('#chur')
  let cust = document.querySelector('#cust')
 
  // get custom stream url from input
  let strm = document.querySelector('#custom-stream')

  // get dialog close button
  let cls  = document.querySelector('#close')
  let help = document.querySelector('#help')

  // get top button
  let goTop = document.querySelector('#top-button')

  // Run default stream CKAT
  changeStream(
		  'https://radioamd-i.akamaihd.net/hls/live/496504/ckat/48k/master.m3u8',
		  'CKAT'
		  )

  // Change stream on choice
  ckat.onclick = () => changeStream(
		  'https://radioamd-i.akamaihd.net/hls/live/496504/ckat/48k/master.m3u8', 
		  'CKAT'
		  )
  ckfx.onclick = () => changeStream(
		  'https://radioamd-i.akamaihd.net/hls/live/496508/ckfx/48k/master.m3u8',
		  'CKFX'
		  )
  chur.onclick = () => changeStream(
		  'https://radioamd-i.akamaihd.net/hls/live/496507/chur/48k/master.m3u8', 
		  'CHUR'
		  )
  cust.onclick = () => changeStream(
		  strm.value,
		  'CUSTOM STREAM'
		  )

  cls.onclick = () => document.querySelector('#popup').style.display = 'none'
  help.onclick = () => document.querySelector('#popup').style.display = 'block'
  goTop.onclick = () => window.scrollTo(0, 0)
}
