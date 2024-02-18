let activeTabId;

async function addVideoCards() {
    const videoList = await chrome.runtime.sendMessage({
        type: "variable", 
        name: "videoList", 
        accessor: "get",
        tabId: activeTabId
    });
    const videoListContainer = document.getElementById("videoListContainer");
    for(const videoDescription of videoList) {
        videoListContainer.append(createVideoCard(videoDescription));
    }
}

//get videos list only on popup open, not in readystatechange;

function createVideoPropertyElement( [key, value] ) {
    const videoPropertyElement = document.createElement("span");
    videoPropertyElement.classList.add("videoItemPropery");
    if(key === "videoIndex") {
        videoPropertyElement.classList.add("videoItemName");
        videoPropertyElement.innerHTML = `VIDEO_STREAM #${value}`;
    } else {
        const propertyName = document.createElement("span");
        propertyName.classList.add("propertyName");
        propertyName.innerHTML = `${key}: `
        videoPropertyElement.append(propertyName);
        videoPropertyElement.innerHTML += `${value}`;
    }

    return videoPropertyElement;
}

function createVideoCard(videoDescription) {
    const videoDescriptionContainer = document.createElement("button");
    videoDescriptionContainer.classList.add("videoItem");

    for(const property of Object.entries(videoDescription)) {
        const videoPropertyElement = createVideoPropertyElement(property);
        videoDescriptionContainer.append(videoPropertyElement);
    }

    videoDescriptionContainer.addEventListener("click", () => {
        chrome.runtime.sendMessage({
            type: "action",
            name: "openVideoInPip",
            value: videoDescription.videoIndex,
            tabId: activeTabId
        });
    });

    return videoDescriptionContainer;
}

function main() {
    chrome.tabs.query({ active: true }, (tabs) => {
        activeTabId = tabs[0].id;     
        addVideoCards();
    });
}

main();
