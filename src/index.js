import Hls from 'hls.js'
//import ID3 from 'id3-parser'

class Main {
  constructor(source, aac) {
    // Stream url piped through object
    this.source = source
    this.aac    = aac

    // ID3 Tag Globals
    this.id3 = {
      title: '[none]',
      artist: '[none]',
      station: '[none]',
      audioType: '[none]',
      encoder: '[none]',
      sampleRate: '[none]',
      creationDate: '[none]',
      data: '[none]'
    }

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

  getAllIndexes(array, value) {
    let indexes = [], 
	i = -1

    while((i = array.indexOf(value, i+1)) != -1) {
      indexes.push(i)
    }

    return indexes
  }

  extractMetadata(data) {
    let station, title, artist, audioType, encoder, sampleRate, creationDate, startLoc, endLoc

    // Get the title
    startLoc = data.indexOf("TIT2") + 4
    endLoc   = data.indexOf("TPE1")
    title    = data.substring(startLoc, endLoc)

    // Get the artist
    startLoc = data.indexOf("TPE1") + 4
    endLoc   = data.indexOf("TFLT")
    artist   = data.substring(startLoc, endLoc)

    // Get the station
    startLoc = data.indexOf('TRSN') + 4
    endLoc   = data.indexOf('TIT2')
    station  = data.substring(startLoc, endLoc).replace('!', '')

    // Get all User defined data fields
    let userFields = this.getAllIndexes(data, 'TXXX')

    // Get the audio object type
    startLoc = data.indexOf('TFLT') + 4
    endLoc   = data.indexOf('TXXX')
    audioType = data.substring(startLoc, endLoc).replace(/\t/, '')

    // Get the encoder
    startLoc = userFields[1] + 4
    endLoc   = userFields[2]
    encoder  = data.substring(startLoc, endLoc).replace('enc', '').replace(3, '')

    // Get the sample rate
    startLoc = userFields[5] + 4
    endLoc   = userFields[6]
    sampleRate = data.substring(startLoc, endLoc).replace('asr', '')

    // Get the creation date
    startLoc = userFields[7] + 8
    endLoc   = data.indexOf('UTC') + 3
    creationDate = data.substring(startLoc, endLoc).replace('crd', '')

    console.log(data)

    this.id3 = {
      title,
      artist,
      station,
      audioType,
      encoder,
      sampleRate,
      creationDate,
      data
    }
  }

  processID3(data) {
    let samples = data.samples
    let encodedTag
    let parsedTag = []

    encodedTag = samples[0].data
    
    encodedTag.forEach((element) => {
      parsedTag.push(String.fromCharCode(element))
    })
   
    console.log(parsedTag)

    let tagAsString = parsedTag.toString().replace(/,/g, '')

    this.extractMetadata(tagAsString)
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

          this.processID3(data)
	
          this.id3output.innerHTML = "ID3 TAGS\n=============\n\nTITLE: " + this.id3.title + "\nARTIST: " + this.id3.artist + "\nSTATION: " + this.id3.station + "\nENCODER: " + this.id3.encoder + "\nAUDIO TYPE: " + this.id3.audioType + "\nSAMPLE RATE: " + this.id3.sampleRate + "\nCREATION DATE: " + this.id3.creationDate + "\nFULL ID3 STRING:\n\n" + this.id3.data

        })

        // Fire when userdata changes
        hls.on(Hls.Events.FRAG_PARSING_DATA, (event, data) => {

          //this.users.innerHTML = "USER DATA\n=================\n\n" + JSON.stringify(data, null, 2) 
          //console.log('data changed')
          //console.log(data)
        })

       
      })

    } else {
      this.status.innerHTML = 'Sorry, HLS streaming is not supported in your browser.'
    }
  }
}

function changeStream(_url, _aac, _stream) {
  let __main__ = new Main(_url, _aac)
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

  // get dialog close button
  let cls  = document.querySelector('#close')
  let help = document.querySelector('#help')

  // get top button
  let goTop = document.querySelector('#top-button')

  // Run default stream CKAT
  changeStream(
		  'https://radioamd-i.akamaihd.net/hls/live/496504/ckat/48k/master.m3u8',
		  'https://radioamd-i.akamaihd.net/hls/live/496504/ckat/48k/master-131.aac',
		  'CKAT'
		  )

  // Change stream on choice
  ckat.onclick = () => changeStream(
		  'https://radioamd-i.akamaihd.net/hls/live/496504/ckat/48k/master.m3u8', 
		  'https://radioamd-i.akamaihd.net/hls/live/496504/ckat/48k/master-131.aac',
		  'CKAT'
		  )
  ckfx.onclick = () => changeStream(
		  'https://radioamd-i.akamaihd.net/hls/live/496508/ckfx/48k/master.m3u8',
		  'https://radioamd-i.akamaihd.net/hls/live/496508/ckfx/48k/master-301.aac', 
		  'CKFX'
		  )
  chur.onclick = () => changeStream(
		  'https://radioamd-i.akamaihd.ne}t/hls/live/496507/chur/48k/master.m3u8', 
		  'https://radioamd-i.akamaihd.ne}t/hls/live/496507/chur/48k/master-299.aac', 
		  'CHUR'
		  )

  cls.onclick = () => document.querySelector('#popup').style.display = 'none'
  help.onclick = () => document.querySelector('#popup').style.display = 'block'
  goTop.onclick = () => window.scrollTo(0, 0)
}
