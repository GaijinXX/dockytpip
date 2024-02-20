let expectedSize = {};
let playerWindowVariables = {};
let videoArray = [];

//injext playerHTML only if true;
let isVideo = false;

//openPiP into separate file
//openPipAfterUserActivation automatically if no user activation on openPiP
async function openPiP(video, videoAspectRatio) {
    console.log("openpip");
    const playerHTMLPromise = chrome.runtime.sendMessage({
        type: "variable", 
        name: "playerHTML", 
        accessor: "get" 
    });
    const { videoHeight, nonClientAreaSize, isBraveMode } = playerWindowVariables;

    console.log(video);
    if(videoAspectRatio === undefined) {
        videoAspectRatio = video.videoWidth / video.videoHeight;
    }

    const pipOptions = {
        height: videoHeight + nonClientAreaSize.vertical,
        width:  videoHeight * videoAspectRatio + nonClientAreaSize.horizontal,
    };
    
    console.log("Client Area Size is %s", JSON.stringify(nonClientAreaSize));

    if(isBraveMode === true) {
        console.warn("Using Brave Mode");
        setBraveMode(pipOptions);
    }
    expectedSize = pipOptions;

    const pipWindow = await documentPictureInPicture.requestWindow(pipOptions);

    pipWindow.document.write(await playerHTMLPromise);
    const originalVideoLocation = video.parentElement;
    pipWindow.document.getElementById("video").replaceWith(video);
    pipWindow.addEventListener('pagehide', () => {
        originalVideoLocation.append(video);
        //video.style.top = "0px";.
    });
}

//Stupid hack around a bug, better than nothing;
function setBraveMode(pipOptions) {
    pipOptions.width  += 25;
    pipOptions.height += 39;
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
    activationDiv.style = "position: absolute; background-color: #D9D9D9; width: 100%; height: 100%; opacity: 0.7; z-index: 9999999999;";
    document.body.append(activationDiv);
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

function extensionMessageHandler(message, sender, sendResponse) {
    console.log(message);
    if(message.type === "variable" && message.name === "videoList" && message.accessor === "get") {
        const result = createVideoDescriptionList();
        sendResponse(result);
    } else if(message.type === "action" && message.name === "openVideoInPip") {
        openPipAfterUserActivation(message.value);
    }
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
    chrome.runtime.onMessage.addListener(extensionMessageHandler);
    window.addEventListener("message", pipMessageHandler, false);
    document.addEventListener("readystatechange", setAndCreateVideoDescriptionList);
    createVideoDescriptionList();
    getPlayerWindowVariables();

    if(/^(https:\/\/www\.youtube\.com)/.test(window.location.href)) {
        addYoutubeHandler();
    }
}

main();