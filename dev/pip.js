let video = document.getElementsByTagName("video")[0];
video.classList.add("video-js");

let player = videojs(video, {
    controls: true,
    fill: true,
    controlBar: {
        fullscreenToggle: false,
        pictureInPictureToggle: false,
        skipButtons: {
            forward: 15,
            backward: 15
        }
      },
    userActions: {
        hotkeys: function(e) {
            switch (e.key) {
                case "ArrowLeft":
                    changeTime(-5);
                    break;
                case "ArrowRight":
                    changeTime(+5);
                    break;
                case "ArrowUp":
                    changeVolume(+0.05);
                    break;
                case "ArrowDown":
                    changeVolume(-0.05);
                    break;
                case " ":
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                    break;
                case "m":
                    player.muted(!player.muted());
                default:
                    break;
            }
        }
    },
    inactivityTimeout: 1000,
    preload: "auto",
});

//make it foolproof with ifs and such
function changeTime(secs) {
    player.currentTime(player.currentTime() + secs);
}

function changeVolume(vol) {
    player.volume(player.volume() + vol);
}

player.on('ready', function() {
    let vjs = document.getElementById("vjs_video_3");
    if(video.paused === false) {
        video.dispatchEvent(new Event("play"));
    }
    video.focus();
});