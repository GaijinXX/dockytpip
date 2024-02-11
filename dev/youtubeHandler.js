async function youtubeHandler() {
    async function createButton() {
        const openPipButton = document.createElement('button');
        openPipButton.textContent = 'Open PIP';
        Object.assign(openPipButton.style, { borderRadius: "0.5vw", margin: "0.2% 2%", backgroundColor: "rgb(255, 250, 250)" })
        document.getElementsByClassName("ytp-left-controls")[0].append(openPipButton);
        openPipButton.addEventListener('click', () => {
            const video = videoList[0];
            let videoAspectRatio;
            //Uncaught TypeError: Cannot read properties of undefined (reading 'videoWidth') at HTMLButtonElement.<anonymous> (<anonymous>:10:22)
            if(video.videoWidth === 0) {
                videoAspectRatio = parseInt(video.style.height) / parseInt(video.style.width);
            } else {
                videoAspectRatio = video.videoHeight / video.videoWidth;
            }
            //chrome.runtime.sendMessage({ getVideo: 0, videoAspectRatio: videoAspectRatio });
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
}

export default addYoutubeHandler;