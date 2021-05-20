let cc = undefined

let htermTE;

define([
  "command",
  "util/chromePromise",
  "settings!user",
  "sessions",
  ], function(command, chromeP, Settings, sessions) {

  let terminalContainer = document.querySelector("#embeddedterminal");
  let terminalElement = undefined


  cc = command;
  // htermTE, connID, UI_INSTANCE and inputOutut are global variables from Beagle Term. I don't want to rewrite beagle term,
  // so I'll tolerate using them this way.

  command.on("init:restart", function () {
    command.fire("terminal:restart");
  });
  command.on("init:startup", function() {
    command.fire("terminal:init");
  });

  let userConfig = undefined;

  command.on("terminal:init", function () {
    t = beagleTermStart();
    console.log(t);
    htermTE = t;

    t.onTerminalReady = function() {
      UI_INSTANCE.OnHtermReady();
      console.log("t = ", t, "htermTE=", htermTE);
      t.runCommandClass(Crosh, document.location.hash.substr(1));
      hterm.Parser.identifiers.actions.clearScrollback(t);
      inputOutput.println('Beacon Serial Terminal for Chrome and ChromeOS. https://github.com/jkrei0/beacon');
      
      terminalElement = htermTE.div_.firstChild

      terminalContainer.style.height = "250px";
      terminalElement.style.display = "block";
      terminalElement.style.height = terminalContainer.style.height;
      command.fire("terminal:restart");
      return true;
    };
  });
  command.on("terminal:restart", function () {
    userConfig = Settings.get("user");
    document.querySelector("#terminalUITheme").setAttribute("href", "css/terminal-"+userConfig.uiTheme+".css")
    theme = userConfig.terminalTheme;
    if (theme !== "dark" && theme !== "twilight" && theme !== "grey" && theme !== "light") {
      theme = userConfig.uiTheme;
    }
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
    chrome.serial.getDevices(function(ports) {
      if (ports.length > 0) {
        var HTML = "";
        var portPicker = document.querySelector('#portDropdown');
        ports.forEach(function(portNames) {
          var portName = portNames.path;
          HTML = HTML + '<option value="' +
            portName + '">' + portName + '</option>';
        });
        portPicker.innerHTML = HTML;
      }
    });
  });

  document.querySelector("#terminalshortcutrun").addEventListener('click', ()=>command.fire("terminal:shortcut-run"))
  command.on("terminal:shortcut-run", function() {
    shortcut = userConfig.runShortcut
    htermTE.command.sendString_(true, shortcut);
  });
  
  document.querySelector("#terminalshortcutstop").addEventListener('click', ()=>command.fire("terminal:shortcut-stop"))
  command.on("terminal:shortcut-stop", function() {
    shortcut = userConfig.runShortcut
    htermTE.command.sendString_(true, shortcut);
  });

  document.querySelector("#terminalclear").addEventListener('click', ()=>command.fire("terminal:clear"))
  command.on("terminal:clear", function() {
    console.log("clear");
    hterm.Parser.identifiers.actions.clearScrollback(htermTE);
    htermTE.io.println('Beacon Serial Terminal for Chrome and ChromeOS. https://github.com/jkrei0/beacon');
  });

  document.querySelector("#terminalopeninfile").addEventListener('click', ()=>command.fire("terminal:open-in-file"))
  command.on("terminal:open-in-file", function() {
    console.log("open-in-file");
    
    date = new Date();
    text = `Terminal Copied At ${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}-${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    text += "\nBe sure you save this file if you want to keep the data in it.\n"
    
    for (row of htermTE.scrollbackRows_) {
      text += "\n"+row.innerText;
    }
    for (row of htermTE.screen_.rowsArray) {
      text += "\n"+row.innerText;
    }
    sessions.addFile(text)
  });

  document.querySelector("#terminaldisconnect").addEventListener('click', ()=>command.fire("terminal:disconnect"))
  command.on("terminal:disconnect", function() {
    console.log(UI_INSTANCE.connectionId)
    chrome.serial.flush(UI_INSTANCE.connectionId, (_)=>{
      chrome.serial.disconnect(UI_INSTANCE.connectionId, (result)=>{
        UI_INSTANCE.ShowSettingsDialog();
        htermTE.io.println(`Disconnected from device on ${UI_INSTANCE.connectionPort} via Connection ID ${UI_INSTANCE.connectionId} with result ${result}`)
      });
    });
    
    htermTE.div_.removeChild(htermTE.div_.firstChild);
    htermTE = undefined;
    command.fire("terminal:init");
    command.fire("terminal:restart");
  });
})