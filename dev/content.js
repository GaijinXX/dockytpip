let expectedSize = {};
let playerWindowVariables = {};
let videoArray = [];

//openPiP into separate file
//openPipAfterUserActivationautomatically if no user activation on openPiP
async function openPiP(video, videoAspectRatio) {
    const playerHTML = chrome.runtime.sendMessage({
        type: "variable", 
        name: "playerHTML", 
        accessor: "get" 
    });
    const { videoHeight, nonClientAreaSize, isBraveMode } = playerWindowVariables;

    if(videoAspectRatio === undefined) {
        videoAspectRatio = video.videoWidth / video.videoHeight;
    }

    const pipOptions = {
        height: videoHeight + nonClientAreaSize.vertical,
        width:  videoHeight * videoAspectRatio + nonClientAreaSize.horizontal,
    };
    
    console.log("Cliend Area Size is %s", JSON.stringify(nonClientAreaSize));

    if(isBraveMode === true) {
        console.warn("Using Brave Mode");
        setBraveMode(pipOptions);
    }
    expectedSize = pipOptions;

    const pipWindow = await documentPictureInPicture.requestWindow(pipOptions);

    pipWindow.document.write(await playerHTML);
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
    return document.getElementsByTagName("video");
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
    if(message.type === "variable" && message.name === "videoList" && message.accessor === "get") {
        const result = createVideoDescriptionList();
        sendResponse(result);
    } else if(message.type === "action" && message.name === "openVideoInPip") {
        openPipAfterUserActivation(message.value);
    }
}

function pipMessageHandler(event) {
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

function main() {
    chrome.runtime.onMessage.addListener(extensionMessageHandler);
    document.addEventListener("readystatechange", setAndCreateVideoDescriptionList);
    window.addEventListener("message", pipMessageHandler, false);

    getPlayerWindowVariables();
}

main();