const playButton        = document.getElementById("playpause");
const seekBarProgress   = document.getElementById("progress");
const seekBarLine       = document.getElementById("line");
const seekBarControl    = document.getElementById("control");
const volumeButton      = document.getElementById("volume");
const controls          = document.getElementById("controls");
const player            = document.getElementById("player");
const volumeSlider      = document.getElementById("volume-slider");
const volumeValue       = document.getElementById("volume-value");

const playIcon  = document.getElementById("playIcon").outerHTML;
const pauseIcon = document.getElementById("pauseIcon").outerHTML;

const volumeFullIcon  = document.getElementById("volumeFull").outerHTML;
const volumeLowIcon   = document.getElementById("volumeLow").outerHTML;
const volumeOffIcon   = document.getElementById("volumeOff").outerHTML;
const volumeMutedIcon = document.getElementById("volumeMuted").outerHTML;

const spinnerIcon   = document.getElementById("spinner").outerHTML;

const resizeMarker = document.getElementById("resizeMarker");

const video = document.getElementsByTagName("video")[0];
const originalWindow = window.opener;

let verticalNonClientAreaSize;
let horizontalNonClientAreaSize;

let videoAspectRatio = null;
let currentVolumeIcon = null;
let isResizeHandlerObserverActive = false;
let isResizeToBeFiredByCode = false;

function setInitialPlayerState() {
    originalWindow.postMessage({ 
        playerSize: {
            height: window.outerHeight, 
            width:  window.outerWidth
        }
    });
    verticalNonClientAreaSize    = window.outerHeight - window.innerHeight;
    horizontalNonClientAreaSize  = window.outerWidth  - window.innerWidth;
    originalWindow.postMessage({ 
        nonClientAreaSize: {
            vertical: verticalNonClientAreaSize, 
            horizontal: horizontalNonClientAreaSize
        }
    });
    videoAspectRatio = video.videoWidth / video.videoHeight;
    //resizeHandler();
    setVolume();
    updateSeekbarPosition();
    if(video.paused === true) {
        playButton.innerHTML = playIcon;
    } else {
        playButton.innerHTML = pauseIcon;
    }
}

function updateVideoTimeToPixel(e) {
    video.currentTime = video.duration * (e.offsetX / seekBarControl.offsetWidth);   
}

function seekVideo(time) {
    video.currentTime += time;
}

function togglePlayPause() {
    if(video.paused === true) {
        video.play();
    } else {
        video.pause();
    }
}

function toggleMute() {
    if(video.muted === true) {
        video.muted = false;
    } else {
        video.muted = true;
    }
}

function selectVolumeIcon(volume) {
    if(volume > 60) {
        return volumeFullIcon;
    } else if (volume > 10) {
        return volumeLowIcon;
    } else {
        return volumeOffIcon;
    }
}

function setVolume() {
    volumeSlider.value = volumeValue.innerHTML = Math.round(video.volume * 100);
    currentVolumeIcon = selectVolumeIcon(video.volume * 100);
    if(video.muted === false) {
        volumeButton.innerHTML = currentVolumeIcon;
    } else {
        volumeButton.innerHTML = volumeMutedIcon;
    }
}

function updateSeekbarPosition() {
    seekBarProgress.style.width = video.currentTime / video.duration * 100 + "%";
}

function changeVolume(volume) {
    video.volume = Math.max(0, Math.min(video.volume * 100 + volume, 100)) / 100;
}

function resizeHandler() {
    if(isResizeToBeFiredByCode === true) {
        isResizeToBeFiredByCode = false;
        return;
    }
    if(isResizeHandlerObserverActive === true) {
        return;
    }
    resizeMarker.removeAttribute("hidden");
    isResizeHandlerObserverActive = true;
    let userActionObserver = setInterval(() => {
        if(navigator.userActivation.isActive === true) {
            isResizeToBeFiredByCode = true;
            isResizeHandlerObserverActive = false;
            window.resizeTo(window.outerWidth, window.innerWidth / videoAspectRatio + verticalNonClientAreaSize);
            resizeMarker.setAttribute("hidden", "");
            clearInterval(userActionObserver);
        }
    }, 100);
}

video.addEventListener("play", () => { 
    playButton.innerHTML = pauseIcon; 
});
video.addEventListener("pause", () => { 
    playButton.innerHTML = playIcon; 
});
video.addEventListener("timeupdate", updateSeekbarPosition);
video.addEventListener("seeking", updateSeekbarPosition);
video.addEventListener("volumechange", setVolume);
seekBarControl.addEventListener("mousemove", (e) => {
    seekBarLine.style.left = e.offsetX;
});
seekBarControl.addEventListener("mouseover", () => {
    seekBarLine.style.visibility = "visible";
});
seekBarControl.addEventListener("mouseout", () => {
    seekBarLine.style.visibility = "hidden";
});

seekBarControl.addEventListener("click", updateVideoTimeToPixel);
seekBarControl.addEventListener("mousedown", () => {
    const controller = new AbortController;
    seekBarControl.addEventListener("mousemove", updateVideoTimeToPixel, { signal: controller.signal });
    seekBarControl.addEventListener("mouseup", () => {
        controller.abort();
    }, { once: true });
});
playButton.addEventListener("click", (e) => {
    if(e.pointerType.length === 0) {
        return;
    }
    togglePlayPause();
});
volumeButton.addEventListener("click", (e) => {
    if(e.pointerType.length === 0) {
        return;
    }
    toggleMute();
});
volumeSlider.addEventListener("input", (e) => { 
    video.volume = e.target.value / 100; 
});

player.addEventListener("dblclick", togglePlayPause);

window.addEventListener("resize", resizeHandler);

window.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "ArrowLeft":
            seekVideo(-5);
            break;
        case "ArrowRight":
            seekVideo(+5);
            break;
        case "ArrowDown":
            changeVolume(-5);
            break;
        case "ArrowUp":
            changeVolume(+5);
            break;
        case " ":
            togglePlayPause();
            break;
        case "m":
            toggleMute();
            break;
        default:
            break;
    }
});

video.addEventListener("waiting", (e) => {
    let timeout = setTimeout(() => {
        document.getElementsByClassName("spinner-container")[0].innerHTML = spinnerIcon;
    }, 500);
    video.addEventListener("playing", (e) => {
        clearTimeout(timeout);
        document.getElementsByClassName("spinner-container")[0].innerHTML = "";
    }, { once: true });
});

setInitialPlayerState();

//ytp-ad-skip-button-modern
//ytp-ad-skip-button-container