chrome.runtime.onMessage.addListener(messageHandler);
chrome.runtime.onInstalled.addListener(onInstalled);
chrome.tabs.onActivated.addListener(onActivated);

let videoHeight = 300;
let nonClientAreaSize = {horizontal: 0, vertical: 0};
let playerHTML = "";
let videoList = [];
let isValuesInitialised = false;
let excludedDomainsArray = [];

async function initiliseValues() {
    const nonClientAreaSizePromise = getSingleValueFromStorage("nonClientAreaSize");
    Promise.allSettled([nonClientAreaSizePromise]).then(async () => {
        nonClientAreaSize = await nonClientAreaSizePromise ?? nonClientAreaSize ;
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

let openTabs = {};
function onInstalled() {
    console.log("This is an install");
    chrome.tabs.query({}).then(tabs => {
        tabs.forEach(tab => {
            if(/^(chrome:\/\/)/.test(tab.url)) {
                return;
            }
            if(tab.active === true) {
                injectContentScript(tab.id);
                return;
            }
            openTabs[tab.id] = false;
        });
    });
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
        excludeMatches: excludedDomainsArray,
        runAt: "document_start",
        allFrames: false,
        persistAcrossSessions: true,
    }]).catch((error) => {
        console.error(error)
    });
}

//throw propper error if content script on the tabId doesent exist
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
                return ({ videoHeight, nonClientAreaSize });
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
        },
        {
            name: "isDomainExcluded",
            set: (message) => {
                console.log(message.websiteUrl);
                const websiteMask = "*://" + message.websiteUrl + "/*";

                if(message.value === true) {
                    excludedDomainsArray.push(websiteMask);
                    console.log(`Website ${websiteMask} is added!!!`);
                } else {
                    excludedDomainsArray = excludedDomainsArray.filter((item) => item !== websiteMask);
                    console.log(`Website ${websiteMask} is removed ;(`);
                }

                chrome.storage.sync.set({ excludedDomainsArray: excludedDomainsArray }).then(() => {
                    console.log("Value is set");
                });

                console.log(excludedDomainsArray);
                chrome.scripting.updateContentScripts([{
                    id: "mainContentScript",
                    excludeMatches: excludedDomainsArray
                }])

                chrome.tabs.sendMessage(message.tabId, {
                    type: "variable", 
                    name: "isContentScriptActive", 
                    accessor: "set",
                    value: message.value,
                });
            }, 
            get: (message) => {
                const websiteMask = "*://" + message.websiteUrl + "/*";
                return excludedDomainsArray.includes(websiteMask);
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
    chrome.storage.sync.get(["excludedDomainsArray"]).then((result) => {
        console.log(result);
        excludedDomainsArray = result.excludedDomainsArray ?? [];
        console.log(excludedDomainsArray);
        registerMainContentScript();
    });
}

main();


//TASK 6 - clean up the code
//TASK 7 - add proper menu and an ability to exclude sites
//TASK 8 - add initial setup screen for the player
//TASK 8.5 - add indicator that shows that resize is required (RED DOT)
//TASK 9 - refacor resize completly, do it only when nessesary
//TASK 10 - MORE BUG FIXES AND TESTING ON DIFFERENT PLATFORMS AND ENVIROMENTS
//Add controls for actions with setActionHandler()
//Move to chrome.storage.local
//add throw Error("..."); where necessary
// Add context menu as an option later
//https://developer.chrome.com/docs/web-platform/document-picture-in-picture#focus_the_opener_window
//Add checks for browser version during extension (initialisation/browser update)