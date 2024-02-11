import addYoutubeHandler from "./youtubeHandler.js";

let videoHeight = 300;
let nonClientAreaSize = {vertical: 0, horizontal: 0};
let isBraveMode = false;
let playerHTML = "";

async function initiliseValues() {
    chrome.storage.local.get("nonClientAreaSize").then(value => {
        if(Object.keys(value).length > 0) {
            nonClientAreaSize = Object.values(value)[0];
        }
    });
    chrome.storage.local.get("isBraveMode").then(value => {
        if(Object.keys(value).length > 0) {
            isBraveMode = Object.values(value)[0];
        }
    });
}

async function buildUpPlayer() {
    let playerHTML = await fetch(chrome.runtime.getURL("player.html")).then(res => res.text());
    playerHTML = playerHTML.replace("#playerStyle",  chrome.runtime.getURL("style.css"));
    playerHTML = playerHTML.replace("#playerScript", chrome.runtime.getURL("player.js"));
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (Object.keys(message)[0]) {
        case "getPlayerHTML":
            sendResponse(playerHTML);
            break;
        case "getVideo":
            chrome.tabs.sendMessage(sender.tab.id, Object.assign(message, { videoHeight }));
            break;
        case "getVideoHeight":
            sendResponse(videoHeight);
            break;
        case "getIsBraveMode":
            sendResponse(isBraveMode);
            break;
        case "getNonClientAreaSize":
            sendResponse(nonClientAreaSize);
            break;
        case "getPlayerWindowVariables":
            sendResponse({ videoHeight, nonClientAreaSize, isBraveMode });
            break;
        case "setNonClientAreaSize":
            nonClientAreaSize = Object.values(message)[0];
            chrome.storage.local.set({ nonClientAreaSize });
            break;
        case "setBraveMode":
            setBraveMode(Object.values(message)[0]);
            break;
        case "setVideoHeight":
            videoHeight = Object.values(message)[0];
            break;
        default:
            break;
    }
});

chrome.runtime.onInstalled.addListener(() => {
    navigator.brave?.isBrave().then(setBraveMode)
});

//Might want to ensure that content script is inserted into active tab on extension load
chrome.scripting.registerContentScripts([{
    id: "mainScript",
    matches: ["<all_urls>"],
    js: ['content.js']
}]);

(async () => {
    playerHTML = await buildUpPlayer();
})();

initiliseValues();
addYoutubeHandler();

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