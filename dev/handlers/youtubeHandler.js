function createButton(parentElement) {
    const openPipButton = document.createElement('button');
    openPipButton.id = "openPipButton";
    openPipButton.innerHTML = `<svg viewBox="0 0 36 36" height="100%" width="100%">
    <use class="ytp-svg-shadow" href="#openPipYt"></use>
        <path id="openPipYt" fill="#fff" 
            d="M 8.9238281 8.9238281 C 7.4844568 8.9238281 6.3300781 10.089221 6.3300781 11.515625 L 6.3300781 24.484375 C 6.3300781 25.910779 7.4844568 27.076172 8.9238281 27.076172 L 27.076172 27.076172 C 28.502576 27.076172 29.669922 25.910779 29.669922 24.484375 L 29.669922 11.515625 C 29.669922 10.089221 28.502576 8.9238281 27.076172 8.9238281 L 8.9238281 8.9238281 z M 18.117188 13.447266 C 18.394531 13.447266 18.623047 13.53711 18.802734 13.716797 C 18.982422 13.896484 19.072266 14.125 19.072266 14.402344 C 19.072266 14.679687 18.982422 14.908203 18.802734 15.087891 C 18.623047 15.267578 18.394531 15.357422 18.117188 15.357422 C 17.839844 15.357422 17.611328 15.267578 17.431641 15.087891 C 17.251953 14.908203 17.162109 14.679687 17.162109 14.402344 C 17.162109 14.125 17.251953 13.896484 17.431641 13.716797 C 17.611328 13.53711 17.839844 13.447266 18.117188 13.447266 z M 8.0976562 14.144531 L 10.605469 14.144531 C 11.648436 14.144531 12.447266 14.384766 13.001953 14.865234 C 13.560546 15.345703 13.839844 16.035157 13.839844 16.933594 C 13.839844 17.921874 13.560546 18.681641 13.001953 19.212891 C 12.447266 19.740234 11.648436 20.003906 10.605469 20.003906 L 9.5097656 20.003906 L 9.5097656 22.464844 L 8.0976562 22.464844 L 8.0976562 14.144531 z M 22.160156 14.144531 L 24.667969 14.144531 C 25.710936 14.144531 26.509766 14.384766 27.064453 14.865234 C 27.623046 15.345703 27.902344 16.035157 27.902344 16.933594 C 27.902344 17.921874 27.623046 18.681641 27.064453 19.212891 C 26.509766 19.740234 25.710936 20.003906 24.667969 20.003906 L 23.572266 20.003906 L 23.572266 22.464844 L 22.160156 22.464844 L 22.160156 14.144531 z M 9.5097656 15.445312 L 9.5097656 18.703125 L 10.605469 18.703125 C 11.167968 18.703125 11.597657 18.554687 11.894531 18.257812 C 12.195312 17.960938 12.345703 17.539062 12.345703 16.992188 C 12.345703 16.492188 12.195312 16.109375 11.894531 15.84375 C 11.597657 15.578125 11.167968 15.445312 10.605469 15.445312 L 9.5097656 15.445312 z M 23.572266 15.445312 L 23.572266 18.703125 L 24.667969 18.703125 C 25.230468 18.703125 25.660157 18.554687 25.957031 18.257812 C 26.257812 17.960938 26.408203 17.539062 26.408203 16.992188 C 26.408203 16.492188 26.257812 16.109375 25.957031 15.84375 C 25.660157 15.578125 25.230468 15.445312 24.667969 15.445312 L 23.572266 15.445312 z M 15.480469 16.253906 L 18.896484 16.253906 L 18.896484 21.152344 L 20.765625 21.152344 L 20.765625 22.464844 L 15.128906 22.464844 L 15.128906 21.152344 L 17.455078 21.152344 L 17.455078 17.566406 L 15.480469 17.566406 L 15.480469 16.253906 z " />
    </svg>`
    openPipButton.classList.add("ytp-button");
    openPipButton.addEventListener("click", onButtonClick, listenerAbortObject);

    parentElement.prepend(openPipButton);
}

function onButtonClick() {
    const video = videoArray[0];
    let videoAspectRatio;
    if(video.videoWidth === 0) {
        videoAspectRatio = parseInt(video.style.width) / parseInt(video.style.height);
    }
    openPiP(video, videoAspectRatio);
}

function waitAndCreateButton() {
    const parentElement = document.getElementsByClassName("ytp-right-controls")[0];
    if(parentElement === undefined) {
        setTimeout(waitAndCreateButton, 100);
        return;
    }
    createButton(parentElement);
}

async function add() {
    console.log("Add new handler");
    const oldOpenPipButton = document.getElementById("openPipButton");
    if(oldOpenPipButton !== null) {
        oldOpenPipButton.addEventListener("click", onButtonClick, listenerAbortObject);
        return;
    }
    
    if(/^(https:\/\/www\.youtube\.com\/watch\?v=)/.test(window.location.href)) {
        waitAndCreateButton();
    }

    window.navigation.addEventListener("navigate", (event) => {
        if(event.navigationType === "push") {
            addYoutubeHandler();
        }
    });
}


export { add };

    // let throwoutValue;
    // function autoPiP() {
    //     throwoutValue = navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    //     navigator.mediaSession.setActionHandler('enterpictureinpicture', async () => {
    //         const video = videoArray[0];
    //         openPiP(video);
    //     });
    // }
    // autoPiP();