const expandButton = document.createElement('button');
expandButton.textContent = 'Open PIP';
window.document.getElementsByClassName("ytp-left-controls")[0].append(expandButton);

async function openPiP() {
  const pipOptions = {
    width: 650,
    height: 400,
  };

  let script = document.createElement("script");
  script.setAttribute("src", chrome.runtime.getURL("video.min.js"));

  let link = document.createElement("link");
  link.setAttribute("href", chrome.runtime.getURL("video-js.min.css"));
  link.setAttribute("rel", "stylesheet");

  const pipWindow = await documentPictureInPicture.requestWindow(pipOptions);

  pipWindow.document.head.append(script, link);

  pipWindow.document.body.style.margin = "0px";
  
  let video = document.getElementsByTagName("video")[0];
  pipWindow.document.body.append(video);

  let pipscript = document.createElement("script");
  pipscript.setAttribute("src", chrome.runtime.getURL("pip.js"));
  pipWindow.document.body.append(pipscript);
  let style = video.style.cssText;
  video.removeAttribute("style");

  pipWindow.addEventListener('pagehide', () => {
    document.getElementsByClassName("html5-video-container")[0].append(video);
    video.style = style;
    video.className = "video-stream html5-main-video";
  });
}

expandButton.addEventListener('click', () => {
  openPiP();
});
