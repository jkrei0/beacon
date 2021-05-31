
let htermTE;

define([
  "command",
  "util/chromePromise",
  "settings!user",
  "sessions",
  "editor",
  ], function(command, chromeP, Settings, sessions, editor) {

  // define some variables to hold references in.
  let terminalContainer = document.querySelector("#embeddedterminal");
  let terminalElement = undefined;
  let connected = false;
  let userConfig = undefined;
  let htermTE = undefined;

  // UI_INSTANCE and inputOutput are global variables from Beagle Term. I don't want to rewrite beagle term,
  // so I'll tolerate using them this way.

  // Fire the terminal-specific commands when the system starts/restarts
  // I have specific commands for the terminal so I can restart the terinal by itself
  command.on("init:restart", function () {
    command.fire("terminal:restart");
  });
  command.on("init:startup", function() {
    command.fire("terminal:init");
  });

  // one time terminal startup
  command.on("terminal:init", function () {

    // start beagle term.
    t = beagleTermStart();
    htermTE = t;

    // get user settings (user.json)
    userConfig = Settings.get("user");

    t.onTerminalReady = async function() {
      // finish initializing the terminal
      UI_INSTANCE.OnHtermReady();
      t.runCommandClass(Crosh, document.location.hash.substr(1));
      hterm.Parser.identifiers.actions.clearScrollback(t);

      inputOutput.println('Beacon Serial Terminal for Chrome and ChromeOS. https://github.com/jkrei0/beacon');
      
      terminalElement = htermTE.div_.firstChild;
      
      // get the terminal size and resize it properly
      ts = await chromeP.storage.local.get("terminalsize");
      th = await chromeP.storage.local.get("terminalshown");
      height = ts.terminalsize || 250;
      if (th.terminalshown !== true) {
        height = 0;
      }
      command.fire("terminal:resize", height, false);


      // add events to the resize bar on the terminal
      resizebar = document.querySelector("#terminal-drag");
      resizebar.style.top = height;

      resizebar.addEventListener("mousedown", function (de) {
        // when the mouse is pressed, add drag events

        // refresh user preferences
        userConfig = Settings.get("user");

        function onmouseupf (ue) {
          // on mouse up, remove the drag events
          document.removeEventListener("mouseup", onmouseupf);
          document.removeEventListener("mousemove", onmousemovef);
        };
        function onmousemovef (me) {
          // on mouse move (when dragging), move the bar and resize the terminal
          me.preventDefault();

          let winsize = window.innerHeight;
          
          let newpos;
          if (userConfig.terminalPosition === "side") {
            newpos = me.clientX;        // if the terminal is on the size, the new position should be the mouse X, 
            winsize = window.innerWidth;  // and the window size should be the window width.
          } else {
            newpos = me.clientY;
          }
          
          // ensure the terminal is not dragged too large or small.
          if (newpos > winsize - 40) {
            newpos = winsize - 40;
          }
          if (newpos < 200) {
            newpos = 200;
          }

          command.fire("terminal:resize", winsize-newpos); // fire the resize event to actually change the terminal size
        };
        document.addEventListener("mouseup", onmouseupf);
        document.addEventListener("mousemove", onmousemovef);
      });
      

      // restart the terminal to complete startup
      command.fire("terminal:restart");
      return true;
    };
  });

  // on window resize, fire the terminal resize event.
  window.addEventListener("resize", async (evt)=>{
    if (evt.isTrusted) { // but only if the event is trusted (it's user generated).
                         // This prevents infinite resizing since the terminal:resize function emits a resize event
      let ts = await chromeP.storage.local.get("terminalsize"); command.fire("terminal:resize", ts.terminalsize);
    }
  });
  command.on("terminal:resize", async function(pos, save=true) {
    // Fake-resize the window so that the rest of the app updates
    window.dispatchEvent(new Event('resize'));
    height = pos;
    if (save) {
      // save the terminal size (but only if it's supposed to)
      chromeP.storage.local.set({"terminalsize": height});
    }

    document.querySelector("#bottom-menu").style.display = "block";

    let winsize = window.innerHeight;
    if (userConfig.terminalPosition === "side") {
      winsize = window.innerWidth;
    }
    console.log(height, winsize);
    if (height > winsize - 200) {
      height = winsize - 200;
    }

    // check if it's hidden, and show/hide the UI accordingly
    if (height === 0) {
      height = 5;
      $('#settingsModal').modal('hide');
      document.querySelector("#bottom-menu").style.display = "none";
    } else if (height < 30) { // as well as make sure that the unhidden terminal is never smaller than 30px
      height = 30;

    // IF the terminal isn't hidden
    // AND is set to a proper size
    // and is NOT connected
    } else if (!connected) {
      // show the connection dialog
      // this is only useful for when it's shown/hidden
      // it will fire on most user-generated resizes, but will never cause problems
      UI_INSTANCE.ShowSettingsDialog();
    }

    resizebar = document.querySelector("#terminal-drag");

    // set the size
    
    terminalContainer.style.display = "block";
    terminalElement.style.display = "block";
    terminalContainer.style.bottom = "0px";
    terminalElement.style.bottom = "0px";

    if (userConfig.terminalPosition === "side") {
      // if the terminal is on the size
      document.querySelector(".project").style.maxHeight = (window.innerHeight-55) + "px";
      document.querySelector(".central").style.width = window.innerWidth - (height) + "px";
      document.querySelector(".bottom-bar").style.width = window.innerWidth - (height) + "px";
      document.querySelector(".bottom-bar").style.alignSelf = "flex-start";

      terminalContainer.style.position = "fixed";
      terminalContainer.style.width = height + "px";
      terminalContainer.style.right = "0px";
      terminalContainer.style.height = window.innerHeight - 38 + "px";

      terminalElement.style.width = height-5 + "px";
      terminalElement.style.right = "0px";
      terminalElement.style.height = window.innerHeight - 38 + "px";
      
      // move the resize-drag bar
      resizebar.style.width = "5px";
      resizebar.style.height = "calc(100% - 30px)";
      resizebar.style.top = "0px";
      resizebar.style.right = height-5 + "px";

    } else {
      // if the terminal is on the bottom
      document.querySelector(".project").style.maxHeight = "100%";
      document.querySelector(".central").style.width = "";
      document.querySelector(".bottom-bar").style.width = "";
      document.querySelector(".bottom-bar").style.alignSelf = "flex-end";

      terminalContainer.style.position = "relative";
      terminalContainer.style.height = height + "px";
      terminalContainer.style.width = "100%";

      terminalElement.style.height = height-5 + "px";
      terminalElement.style.width = "100%";

      // move the resize-drag bar
      resizebar.style.width = "100%";
      resizebar.style.height = "5px";
      resizebar.style.bottom = height-5 + "px";
      resizebar.style.right = "0px";
    }
  });

  command.on("terminal:restart", async function () {
    // get/refresh user settings
    userConfig = Settings.get("user");
    // load the appropriate theme stylesheet
    document.querySelector("#terminalUITheme").setAttribute("href", ("css/terminal-"+userConfig.uiTheme).replace("-dark", "")+".css")
    theme = userConfig.terminalTheme;
    if (theme !== "dark" && theme !== "twilight" && theme !== "grey" && theme !== "light") {
      theme = userConfig.uiTheme;
    }
    // recolor the terminal to the appropriate theme
    if (theme == "dark") {
      htermTE.setBackgroundColor("#222525");
      htermTE.setForegroundColor("white");
      htermTE.prefs_.set("cursor-color", "#FFA200");
    } else if (theme == "twilight") {
      htermTE.setBackgroundColor("#090915");
      htermTE.setForegroundColor("#BBB");
      htermTE.prefs_.set("cursor-color", "#35467A");
    } else if (theme == "grey") {
      htermTE.setBackgroundColor("#444");
      htermTE.setForegroundColor("#EEE");
      htermTE.prefs_.set("cursor-color", "#FFA200");
    } else if (theme == "light") {
      htermTE.setBackgroundColor("#f7f7f7");
      htermTE.setForegroundColor("#111");
      htermTE.prefs_.set("cursor-color", "#880088");
    }

    // refresh the list of serial devices
    chrome.serial.getDevices(function(ports) {
      if (ports.length > 0) {
        var listed = [];
        var HTML = "";
        var portPicker = document.querySelector('#portDropdown');

        // loop through each connected device and add it to the dropdown
        ports.forEach(function(portNames) {
          if (listed.indexOf(portNames.path) < 0) {
            var portName = portNames.path;
            HTML = HTML + '<option value="' +
              portName + '">' + portName + '</option>';
            listed.push(portName);
          }
        });
        portPicker.innerHTML = HTML;
      }
    });

    // get saved terminal size and fire the terminal:resize event to properly resize the terminal
    ts = await chromeP.storage.local.get("terminalsize");
    th = await chromeP.storage.local.get("terminalshown");
    height = ts.terminalsize || 250;
    if (th.terminalshown !== true) {
      height = 0;
    }
    command.fire("terminal:resize", height, false);
  });

  document.querySelector("#terminalshortcutrun").addEventListener('click', ()=>command.fire("terminal:shortcut-run"))
  command.on("terminal:shortcut-run", function() {
    // fire the "run" shortcut specified in user.json
    shortcut = userConfig.runShortcut
    htermTE.command.sendString_(true, shortcut);
  });
  
  document.querySelector("#terminalshortcutstop").addEventListener('click', ()=>command.fire("terminal:shortcut-stop"))
  // fire the "stop" shortcut specified in user.json
  command.on("terminal:shortcut-stop", function() {
    shortcut = userConfig.runShortcut
    htermTE.command.sendString_(true, shortcut);
  });

  document.querySelector("#terminalclear").addEventListener('click', ()=>command.fire("terminal:clear"))
  command.on("terminal:clear", function() {
    // clear the terminal
    hterm.Parser.identifiers.actions.clearScrollback(htermTE);
    htermTE.io.println('Beacon Serial Terminal for Chrome and ChromeOS. https://github.com/jkrei0/beacon');
  });

  document.querySelector("#terminalopeninfile").addEventListener('click', ()=>command.fire("terminal:open-in-file"))
  command.on("terminal:open-in-file", function() {
    // copy the terminal to a file

    // Timestamp the file
    date = new Date();
    text = `Terminal Copied At ${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}-${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    text += "\nBe sure you save this file if you want to keep the data in it.\n"
    
    // loop through and add each row of scrollback & visible terminal
    for (row of htermTE.scrollbackRows_) {
      text += "\n"+row.innerText;
    }
    for (row of htermTE.screen_.rowsArray) {
      text += "\n"+row.innerText;
    }

    // open a new file with the copied text
    sessions.addFile(text)
  });

  document.querySelector('#connectBtn').addEventListener('click', ()=>command.fire("terminal:connect"));
  command.on("terminal:connect", function () {
    // when the connect button is pressed, set the connected flag
    connected = true;
  });

  document.querySelector("#terminaldisconnect").addEventListener('click', ()=>command.fire("terminal:disconnect"));
  command.on("terminal:disconnect", function() {
    // when the disconnect button is pressed, set the connected flag
    connected = false;

    // flush the connection
    chrome.serial.flush(UI_INSTANCE.connectionId, (_)=>{
      chrome.serial.disconnect(UI_INSTANCE.connectionId, (result)=>{
        // reopen the connection dialog, and print a message to the terminal
        UI_INSTANCE.ShowSettingsDialog();
        htermTE.io.println(`Disconnected from device on ${UI_INSTANCE.connectionPort} via Connection ID ${UI_INSTANCE.connectionId} with result ${result}`)
      });
    });
    
    // clear the terminal
    htermTE.div_.removeChild(htermTE.div_.firstChild);
    htermTE = undefined;

    // COMPLETELY (as nearly as I can) restart the terminal.
    // I wish I didn't have to do this, but beagle term is built in a way that makes it annoying to disconnect
    command.fire("terminal:init");
    command.fire("terminal:restart");
  });

  command.on("terminal:show-hide", async function () {
    // show/hide the terminal

    ts = await chromeP.storage.local.get("terminalsize");
    console.log(terminalContainer.style.height, ts.terminalsize);
    if (terminalContainer.style.height === "5px") {
      // if it's hidden, resize it to the saved size
      // save that the terminal is shown
      chromeP.storage.local.set({"terminalshown": true});
      command.fire("terminal:resize", ts.terminalsize || 250, false);
    } else {
      // if it's shown, hide it
      // save that it's hidden
      chromeP.storage.local.set({"terminalshown": false});
      command.fire("terminal:resize", 0, false);
    }
  });
})
