let expectedSize = {};
let playerWindowVariables = {};

//openPiP into separate file
//make videoAspectRatio optional
async function openPiP(video, videoAspectRatio) {
    const playerHTML = chrome.runtime.sendMessage({ getPlayerHTML: "" });
    const { videoHeight, nonClientAreaSize, isBraveMode } = playerWindowVariables;

    const pipOptions = {
        height: videoHeight + nonClientAreaSize.vertical,
        width:  videoHeight / videoAspectRatio + nonClientAreaSize.horizontal,
    };
    
    if(isBraveMode === true) {
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

let videoList = [];
document.addEventListener("readystatechange", () => {
    console.log("readystatechange")
    //Consecutive function calls after openPiP might ruin order of videos in array
    videoList = findAllVideos();
});

(async () => {
    playerWindowVariables = await chrome.runtime.sendMessage({ getPlayerWindowVariables: "" });
})();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(Object.keys(message)[0] === "getVideo") {
        openPiP(videoList[message.getVideo], message.videoAspectRatio, message.videoHeight);
    }
});

window.addEventListener("message", (event) => {
    switch (Object.keys(event.data)[0]) {
        case "playerSize":
            let actualSize = event.data.playerSize;
            console.log(" finalSize: ", (actualSize), " originalSize: ", (expectedSize));
            console.log(" heightDiff: " + (actualSize.height - expectedSize.height) + " widthDiff: " + (actualSize.width - expectedSize.width));
            break;
        case "nonClientAreaSize":
            chrome.runtime.sendMessage({ setNonClientAreaSize: event.data.nonClientAreaSize });
            break;
        default:
            break;
    }
}, false);