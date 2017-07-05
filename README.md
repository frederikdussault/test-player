# Radio Metadata Test Player

Contains 3 streams for CKAT, CKFX, CHUR


### Instructions
Written in ES6, transpiled with Rollup for the browser.
Uses Yarn as a build tool, but you can use NPM if you prefer.


To build, run
```
yarn install && yarn build
```

Also contains a watch script, so to keep watching for changes run:
```
yarn build:watch
```

### Quick Breakdown
I'll keep it brief since it's pretty simple and I doubt it will see much reuse.

There is a global `Hls` object declared at the start of the script. This is necessary to access the Hls.js script linked in the HTML file.

There is a `Main` class containing a few methods. This is where Hls.js is initialized, and the player is controlled.
It takes one parameter when it's initialized -- the stream url. The stream url *must* be an HLS mpeg stream (`.m3u8`)

The `Main` class is initialized each time the stream is changed (when a user clicks one of the stream buttons at the top). This happens in the changeStream global function. The rest of the event listeners occur in a function that fires when the window and DOM are loaded.

That's all there is to it. If you have the PHP command line tool installed, you can run `yarn start` to run a lightweight server.

