
// default terminal position and size
terminalPosition = "bottom"
terminalSize = 250

// button elements
m4HelpButton = document.querySelector("m4Help")
m4RunButton = document.querySelector("#m4RunOrRestart")
m4OptionsMenu = document.querySelector("#options-menu")
m4CloseHelpBtn = document.querySelector("#m4CloseHelp")
m4StopButton = document.querySelector("#m4Stop")
m4HelpButton = document.querySelector("#m4Help")
terminalCopyButton = document.querySelector("#copyTerminal")
terminalClearButton = document.querySelector("#clearTerminal")

// button event listeners
m4RunButton.addEventListener("click", m4RunOrRestart)
m4CloseHelpBtn.addEventListener("click", m4CloseHelp)
m4StopButton.addEventListener("click", m4Stop)
m4HelpButton.addEventListener("click", m4Help)
terminalCopyButton.addEventListener("click", terminalToFile)
terminalClearButton.addEventListener("click", clearTerminal)

// terminal options dropdowns
terminalDivElement = document.querySelector("#embeddedterminal")
terminalPositionDropdown = document.querySelector("#appearance-dockto")
terminalSizeDropdown = document.querySelector("#appearance-size")
terminalThemeDropdown = document.querySelector("#appearance-theme")
terminalThemeDarkDropdown = document.querySelector("#appearance-theme-dark")

// dropdown event listeners.
terminalPositionDropdown.addEventListener('change', updateTerminalPosition)
terminalSizeDropdown.addEventListener('change', updateTerminalSize)
terminalThemeDropdown.addEventListener('change', updateTerminalThemeSettings)
terminalThemeDarkDropdown.addEventListener('change', updateTerminalThemeSettings)

// get saved terminal position and size
chrome.storage.sync.get(['terminalPosition', 'terminalSize'], function(res) {
    console.log(res)
    if (!res.terminalPosition || !res.terminalSize) {
        chrome.storage.sync.set({terminalPosition: "bottom", terminalSize: 250});
    } else {
        updateTerminalPosition()
        terminalPositionDropdown.value = res.terminalPosition;
        terminalPosition = res.terminalPosition;
        terminalSizeDropdown.value = res.terminalSize;
        terminalSize = res.terminalSize;
        console.log('oss', res.terminalPosition, res.terminalSize)
    }
    updateTerminalSize()
});
// get saved terminal themes
chrome.storage.sync.get(['terminalThemeLight', 'terminalThemeDark'], (res) => {
    if (!res.terminalThemeLight || !res.terminalThemeLight) {
        chrome.storage.sync.set({terminalThemeLight: "grey", terminalThemeDark: "dark"})
    } else {
        terminalThemeDropdown.value = res.terminalThemeLight
        terminalThemeDarkDropdown.value = res.terminalThemeDark
        updateTerminalTheme();
    }
});

function updateUITheme() {
    UITheme = window.getComputedStyle(document.querySelector('.tabs').firstChild).borderBottomColor
    if (UITheme == "rgb(136, 0, 136)") { // light
        document.querySelector('#terminalUITheme').setAttribute('href', 'css/terminal-light.css')
    } else if (UITheme == "rgb(255, 162, 0)") { // dark
        document.querySelector('#terminalUITheme').setAttribute('href', '')
    } else if (UITheme == "rgb(53, 70, 122)") { // twilight
        document.querySelector('#terminalUITheme').setAttribute('href', 'css/terminal-twilight.css')
    } else { // otherwise assume light theme
        document.querySelector('#terminalUITheme').setAttribute('href', 'css/terminal-light.css')
    }
    updateTerminalTheme()
}
window.setInterval(updateUITheme, 1000)

function updateTerminalTheme() {
    if (!document.querySelector('.tabs').firstChild) {
        return;
    }
    UITheme = window.getComputedStyle(document.querySelector('.tabs .tab.active')).borderBottomColor
    console.log(UITheme)
    if (UITheme == "rgb(255, 162, 0)" || UITheme == "rgb(53, 70, 122)") {
        if (terminalThemeDarkDropdown.value == "dark") {
            htermTerminalElement.setBackgroundColor("#222525")
            htermTerminalElement.setForegroundColor("white")
        } else if (terminalThemeDarkDropdown.value == "light") {
            htermTerminalElement.setBackgroundColor("#f7f7f7")
            htermTerminalElement.setForegroundColor("#111")
        } else if (terminalThemeDarkDropdown.value == "twilight") {
            htermTerminalElement.setBackgroundColor("#090915")
            htermTerminalElement.setForegroundColor("#BBB")
        } else if (terminalThemeDarkDropdown.value == "grey") {
            htermTerminalElement.setBackgroundColor("#444")
            htermTerminalElement.setForegroundColor("#EEE")
        }
    } else if (UITheme == "rgb(136, 0, 136)") {
        if (terminalThemeDropdown.value == "dark") {
            htermTerminalElement.setBackgroundColor("#222525")
            htermTerminalElement.setForegroundColor("white")
        } else if (terminalThemeDropdown.value == "light") {
            htermTerminalElement.setBackgroundColor("#f7f7f7")
            htermTerminalElement.setForegroundColor("#111")
        } else if (terminalThemeDropdown.value == "twilight") {
            htermTerminalElement.setBackgroundColor("#090915")
            htermTerminalElement.setForegroundColor("#BBB")
        } else if (terminalThemeDropdown.value == "grey") {
            htermTerminalElement.setBackgroundColor("#BBB")
            htermTerminalElement.setForegroundColor("#111")
        }
    }
}
function updateTerminalThemeSettings() {
    chrome.storage.sync.set({terminalThemeLight: terminalThemeDropdown.value, terminalThemeDark: terminalThemeDarkDropdown.value})
    updateTerminalTheme()
}
function updateTerminalSize() {
    terminalSize = terminalSizeDropdown.value;
    updateTerminalPosition()
}
function updateTerminalPosition() {
    terminalElement = document.querySelector("#terminal").firstChild
    pos = terminalPositionDropdown.value
    if (document.querySelector("#terminal").firstChild == undefined) {
        console.log("notfoundterminal")
        window.setTimeout(updateTerminalPosition, 500)
    }
    chrome.storage.sync.set({terminalPosition: pos, terminalSize: terminalSize}, ()=>{console.log('set changed values', pos, terminalSize)});
    if (pos == "bottom") {
        terminalDivElement.style.display = "block";
        terminalElement.style.display = "block";
        terminalDivElement.style.height = terminalSize + "px";
        terminalElement.style.bottom = "0px";
        terminalElement.style.right = "0px";
        terminalElement.style.height = terminalSize + "px";
        terminalElement.style.width = "100%";
        document.querySelector('.central').style.width = "100%"
        document.querySelector('.bottom-bar').style.width = "100%"
        document.querySelector('.bottom-bar').style.alignSelf = "flex-start"
        document.querySelector('.command-line').style.width = "100%"
    } else if (pos == "right") {
        terminalDivElement.style.display = "block";
        terminalElement.style.display = "block";
        terminalDivElement.style.height = "0px";
        terminalElement.style.bottom = "0px";
        terminalElement.style.right = "0px";
        terminalElement.style.height = "calc(100% - 38px)";
        terminalElement.style.width = terminalSize*2 + "px";
        terminalElement.style.borderLeft = "2px solid transparent";
        document.querySelector('.central').style.width = "calc(100% - " + terminalSize*2 + "px)"
        document.querySelector('.bottom-bar').style.width = "calc(100% - " + terminalSize*2 + "px)"
        document.querySelector('.command-line').style.width = "calc(100% - " + terminalSize*2 + "px)"
    } else if (pos == "hidden") {
        terminalDivElement.style.display = "block";
        terminalElement.style.display = "block";
        terminalDivElement.style.height = "0px";
        terminalElement.style.bottom = "0px";
        terminalElement.style.right = "0px";
        terminalElement.style.height = terminalSize + "px";
        terminalElement.style.borderLeft = "none";
        terminalElement.style.width = "100%";
        terminalElement.style.display = "none";
        document.querySelector('.central').style.width = "100%"
        document.querySelector('.bottom-bar').style.width = "100%"
        document.querySelector('.bottom-bar').style.alignSelf = "flex-start"
        document.querySelector('.command-line').style.width = "100%"
    }
}

function clearTerminal() {
    console.log('clearing')
    hterm.Parser.identifiers.actions.clearScrollback(htermTerminalElement)
    htermTerminalElement.io.println('Beacon Serial Terminal for Chrome and ChromeOS. https://github.com/jkrei0/beacon');
}
function terminalToFile() {
    iframe = document.querySelector("#terminal").firstChild
    fcontents = iframe.contentDocument || iframe.contentWindow.document;
    text = fcontents.body.innerText;
    console.log(text)
    newFileWithText(text)
}

m4ctrlC = ""
m4ctrlD = ""

function m4RunOrRestart() {
    self.sendString_(false, document.querySelector("#stopcmd-selection").value)
    self.sendString_(false, document.querySelector("#runcmd-selection").value)
    m4StopButton.removeAttribute("disabled")
}
function m4Stop() {
    self.sendString_(false, document.querySelector("#stopcmd-selection").value)
    self.sendString_(false, "\n")
    m4StopButton.setAttribute("disabled", "true")
}
function m4Help() {
    m4OptionsMenu.style.display = "block"
}
function m4OnStringSent(string) {
    console.log(string)
    if (string == m4ctrlC) {       // ctrl + C
        console.log('ctrl-c')
        m4RunButton.innerHTML = "Run"
    } else if (string == m4ctrlD) { // Ctrl + D
        console.log('ctrl-d')
        m4RunButton.innerHTML = "Restart"
    }
}
function m4CloseHelp() {
    m4OptionsMenu.style.display = "none"
}