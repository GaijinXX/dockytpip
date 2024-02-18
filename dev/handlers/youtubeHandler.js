async function youtubeHandler() {
    async function createButton() {
        const openPipButton = document.createElement('button');
        openPipButton.textContent = 'Open PIP';
        Object.assign(openPipButton.style, { borderRadius: "0.5vw", margin: "0.2% 2%", backgroundColor: "rgb(255, 250, 250)" })
        document.getElementsByClassName("ytp-left-controls")[0].append(openPipButton);
        openPipButton.addEventListener("click", () => {
            const video = videoArray[0];
            let videoAspectRatio;
            if(video.videoWidth === 0) {
                videoAspectRatio = parseInt(video.style.width) / parseInt(video.style.height);
            }
            openPiP(video, videoAspectRatio);
        });
    }

    createButton();
}

function addYoutubeHandler() {
    chrome.webNavigation.onDOMContentLoaded.addListener((tabWindow) => {
        chrome.scripting.executeScript({
            target: { tabId: tabWindow.tabId },
            func: youtubeHandler
        });
    }, {url: [{ urlPrefix: "https://www.youtube.com/watch?v=" }]});

    
    chrome.webNavigation.onHistoryStateUpdated.addListener(() => {
        //Do you remember the first of november
        console.log("onHistoryStateUpdated");
    }, {url: [{ urlPrefix: "https://www.youtube.com/watch?v=" }]});
}

export default addYoutubeHandler;