let expectedSize = {};
let playerWindowVariables = {};
let videoArray = [];

//injext playerHTML only if true;
let isVideo = false;

//openPiP into separate file
//openPipAfterUserActivation automatically if no user activation on openPiP
async function openPiP(video, videoAspectRatio) {
    console.log("Opening PiP window");
    const playerHTMLPromise = chrome.runtime.sendMessage({
        type: "variable", 
        name: "playerHTML", 
        accessor: "get" 
    });
    const { videoHeight, nonClientAreaSize} = playerWindowVariables;

    console.log(video);
    if(videoAspectRatio === undefined) {
        videoAspectRatio = video.videoWidth / video.videoHeight;
    }

    const isLegacy = navigation.activation === undefined;
    console.log(`Chromium version is less than 123: ${isLegacy}`);

    let pipOptions;
    if(isLegacy) {
        pipOptions = {
            height: videoHeight + nonClientAreaSize.vertical,
            width:  videoHeight * videoAspectRatio + nonClientAreaSize.horizontal,
        };

        const isBraveMode = navigator.brave !== undefined;
        if(isBraveMode === true) {
            //Stupid hack around a bug, better than nothing;
            console.log("Using Brave Legacy Mode");
            pipOptions.width  += 25;
            pipOptions.height += 39;
        }
    } else {
        pipOptions = {
            height: videoHeight,
            width:  videoHeight * videoAspectRatio,
        };
    }

    console.log("Client Area Size is %s", JSON.stringify(nonClientAreaSize));

    expectedSize = pipOptions;

    const pipWindow = await documentPictureInPicture.requestWindow(pipOptions);

    pipWindow.document.write(await playerHTMLPromise);
    const originalVideoLocation = video.parentElement;
    //console.log(video);
    pipWindow.document.getElementById("video").replaceWith(video);
    pipWindow.addEventListener('pagehide', () => {
        originalVideoLocation.append(video);
        //video.style.top = "0px";.
    });
}

function findAllVideos() {
    const videoElementsArray = document.getElementsByTagName("video");
    if(videoElementsArray.length > 0) {
        isVideo = true;
    }
    return videoElementsArray;
}

async function getPlayerWindowVariables() {
    playerWindowVariables = await chrome.runtime.sendMessage({
        type: "variable", 
        name: "playerWindowVariables", 
        accessor: "get",
    });
    if(playerWindowVariables === undefined) {
        setTimeout(getPlayerWindowVariables, 100);
    }
};

//Switch to pip call by onclick
function openPipAfterUserActivation(videoNumber) {
    const activationDiv = document.createElement("div");
    activationDiv.style = "position: fixed; background-color: #D9D9D9; top: 0px; left: 0px; width: 100%; height: 100%; opacity: 0.7; z-index: 9999999999;";
    document.body.prepend(activationDiv);
    activationDiv.addEventListener("click", () => {
        openPiP(videoArray[videoNumber]);
        activationDiv.remove();
    });
}

function createVideoDescriptionList() {
    //Consecutive function calls after openPiP might ruin order of videos in array
    videoArray = findAllVideos();
    const videoList = Array.from(videoArray).map((video, index) => ({
        videoIndex: index, 
        id: video.id, 
        class: video.classList.value,
        source: video.src
    }));

    return videoList;
}

function setAndCreateVideoDescriptionList() {
    const videoList = createVideoDescriptionList();
    chrome.runtime.sendMessage({
        type: "variable", 
        name: "videoList", 
        accessor: "set",
        value: videoList
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

let isContentScriptActive = true;
const messages = {
    variable: [
        {
            name: "videoList",
            get: () => {
                return createVideoDescriptionList();
            }
        },
        {
            name: "activeState",
            get: () => {
                return isTabActive;
            },
            set: (message) => {
                isTabActive = message.value;
            }
        },
        {
            name: "isContentScriptActive",
            get: () => {
                return isContentScriptActive;
            },
            set: (message) => {
                isContentScriptActive = message.value;
                console.log(`isContentScriptActive: ${isContentScriptActive}`);
            } 
        }
    ],
    action: [
        {
            name: "openVideoInPip",
            function: (message) => {
                openPipAfterUserActivation(message.value);
            }
        }
    ]
}

const globalContentScriptListenerAbortController = new AbortController();
const listenerAbortObject = { signal: globalContentScriptListenerAbortController.signal };

window.postMessage("checkIfOld");
function removeEventListenersIfOld() {
    if(chrome.runtime.id === undefined) {
        globalContentScriptListenerAbortController.abort();
        window.removeEventListener("message", pipMessageHandler);
        document.removeEventListener("readystatechange", setAndCreateVideoDescriptionList);
        //for(const listener of contentListenerArray) { listener.element.removeEventListener(listener.action, listener.function, {listener.options}) };
    }
}

function pipMessageHandler(event) {
    if(event.data === "checkIfOld") {
        removeEventListenersIfOld();
    }
    switch (Object.keys(event.data)[0]) {
        case "playerSize":
            let actualSize = event.data.playerSize;
            console.log(" finalSize: ", (actualSize), " originalSize: ", (expectedSize));
            console.log(" heightDiff: " + (actualSize.height - expectedSize.height) + " widthDiff: " + (actualSize.width - expectedSize.width));
            break;
        case "nonClientAreaSize":
            chrome.runtime.sendMessage({
                type: "variable", 
                name: "nonClientAreaSize", 
                accessor: "set",
                value: event.data.nonClientAreaSize
            });
            break;
        default:
            break;
    }
}

async function addYoutubeHandler() {
    const src = chrome.runtime.getURL("/handlers/youtubeHandler.js");
    const youtubeHandler = await import(src);
    youtubeHandler.add();
}

function main() {
    chrome.runtime.onMessage.addListener(messageHandler);
    window.addEventListener("message", pipMessageHandler, false);
    document.addEventListener("readystatechange", setAndCreateVideoDescriptionList);
    createVideoDescriptionList();
    getPlayerWindowVariables();

    if(/^(https:\/\/www\.youtube\.com)/.test(window.location.href)) {
        addYoutubeHandler();
    }
}

main();

//Fix popup design
//Add initial instructions
//Make it work when clicking a button from fullscreen