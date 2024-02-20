chrome.runtime.onMessage.addListener(messageHandler);
chrome.runtime.onInstalled.addListener(onInstalled);
chrome.tabs.onActivated.addListener(onActivated);

let videoHeight = 300;
let nonClientAreaSize = {horizontal: 0, vertical: 0};
let isBraveMode = false;
let playerHTML = "";
let videoList = [];
let isValuesInitialised = false;

async function initiliseValues() {
    const nonClientAreaSizePromise = getSingleValueFromStorage("nonClientAreaSize");
    const isBraveModePromise = getSingleValueFromStorage("isBraveMode");
    Promise.allSettled([nonClientAreaSizePromise, isBraveModePromise]).then(async () => {
        nonClientAreaSize = await nonClientAreaSizePromise ?? nonClientAreaSize ;
        isBraveMode = await isBraveModePromise ?? isBraveMode;
        isValuesInitialised = true;
    });
}

async function getSingleValueFromStorage(valueName) {
    const valuePromise = chrome.storage.local.get(valueName).then(value => {
        if(Object.keys(value).length !== 1) {
            return;
        }
        return Object.values(value)[0];
    });

    return valuePromise;
}

async function buildUpPlayer() {
    let playerHTML = await fetch(chrome.runtime.getURL("player/player.html")).then(res => res.text());
    playerHTML = playerHTML.replace("#playerStyle",  chrome.runtime.getURL("player/style.css"));
    playerHTML = playerHTML.replace("#playerScript", chrome.runtime.getURL("player/script.js"));
    return playerHTML;
}

function setBraveMode(isTrue) {
    if(isTrue) {
        isBraveMode = true;
    } else {
        isBraveMode = false;
    }
    chrome.storage.local.set({ isBraveMode });
}

let openTabs = {};
function onInstalled() {
    console.log("This is an install");
    chrome.tabs.query({}).then(tabs => {
        tabs.forEach(tab => {
            if(/^(chrome:\/\/)/.test(tab.url)) {
                return;
            }
            openTabs[tab.id] = false 
        });
    });
    navigator.brave?.isBrave().then(setBraveMode)
}

function onActivated(event) {
    if(Object.hasOwn(openTabs, event.tabId)){
        console.log("Tab was injected");
        injectContentScript(event.tabId);
        delete openTabs[event.tabId];
    }
}

function injectContentScript(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["content.js"],
        injectImmediately: true
    });
}

//return to injecting via execute script (or not, but then:);
//deactivate injected script by passing the message, after reloading extension in registerContentScripts() add excludedMathes: []; 
async function registerMainContentScript() {
    const regScripts = await chrome.scripting.getRegisteredContentScripts({ids: ["mainContentScript"]});
    if(regScripts.length !== 0) {
        console.log("mainContentScript is already there");
        return;
    }
    chrome.scripting.registerContentScripts([{
        id: "mainContentScript",
        js: ["content.js"],
        matches: ["<all_urls>"],
        runAt: "document_start",
        allFrames: false,
        persistAcrossSessions: true,
    }]).catch((error) => {
        console.error(error)
    });
}

function messageHandler(message, sender, sendResponse) {
    const functionToCall = messages[message.type].find(obj => obj.name === message.name)[message.type === "variable" ? message.accessor : "function"];
    const result = functionToCall(message);
    if(result !== undefined && result !== null) {
        if(result instanceof Promise) {
            result.then(res => sendResponse(res));
            return true;
        }
        sendResponse(result);
    }
}

const messages = {
    variable: [
        {
            name: "playerHTML",
            get: () => {
                return playerHTML;
            }
        },
        {
            name: "playerWindowVariables",
            get: () => {
                if(isValuesInitialised === false) {
                    return;
                }
                return ({ videoHeight, nonClientAreaSize, isBraveMode });
            }
        },
        {
            name: "videoList",
            get: (message) => {
                //if async return true in parent handler function, base on whether returned value promise or not;
                return chrome.tabs.sendMessage(message.tabId, message);
            },
            set: (message) => {
                videoList = message.value;
            }
        }, 
        {
            name: "nonClientAreaSize",
            set: (message) => {
                nonClientAreaSize = message.value;
                chrome.storage.local.set({ nonClientAreaSize });
            }
        }
    ],
    action: [
        {
            name: "openVideoInPip",
            function: (message) => {
                chrome.tabs.sendMessage(message.tabId, message);
            }
        }
    ]
}

//Might want to ensure that content script is inserted into active tab on extension load

async function main() {
    (async () => {
        playerHTML = await buildUpPlayer();
    })();

    initiliseValues();
    registerMainContentScript();
}

main();


//TASK 1 - fix brave
//TASK 2 - fix git
//TASK 3 - add menu for any site
//TASK 4 - explore media session enterpictureinpicture on changing tab, very cool
//TASK 5 - FIX BUGS, look throu comments
//TASK 6 - clean up the code
//TASK 7 - add proper menu and an ability to exclude sites
//TASK 8 - add initial setup screen for the player
//TASK 8.5 - add indicator that shows that resize is required (RED DOT)
//TASK 9 - refacor resize completly, do it only when nessesary 
//TASK 10 - MORE BUG FIXES AND TESTING ON DIFFERENT PLATFORMS AND ENVIROMENTS
//
//???????
//
//...
//
//PROFIT!!1!11!!1!
//Add tab mute indicator (or just force mute in video)
//Add controls for actions with setActionHandler()
//Move to chrome.storage.local
//chrome.runtime.onInstalled (?)
//initialising with undefined might actually be  a good idea
//add throw Error("..."); where necessary

//DO SOMETHING ABOUT EXTENSION UPDATE
//Fix YouTube button icon
//Check if reinjection is nesessary on active tab. (chrome.tabs.query);
//pipMessageHandler causes an error
//remove old content script (just event listeners?)