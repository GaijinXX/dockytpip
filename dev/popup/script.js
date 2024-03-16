let activeTab;
let isDomainExcluded = false;

async function addVideoCards() {
    const videoList = await chrome.runtime.sendMessage({
        type: "variable", 
        name: "videoList", 
        accessor: "get",
        tabId: activeTab.id
    });
    const videoListContainer = document.getElementById("videoListContainer");
    console.log(videoList.length);
    if(videoList.length > 0) {
        document.getElementById("noVideos").setAttribute("hidden", "");
    }
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
            tabId: activeTab.id
        });
    });

    return videoDescriptionContainer;
}

function checkIsDomainExcluded() {
    return chrome.runtime.sendMessage({
        type: "variable", 
        name: "isDomainExcluded", 
        accessor: "get",
        tabId: activeTab.id,
        websiteUrl: new URL(activeTab.url).hostname,
    });
}

//check if content sript exists on the page, to awoid error in the console (and maybe to provide a prompt to a user, that they need to restart page);
//perhaps we should inject content script manually if its not present after activation toggle
function main() {
    chrome.tabs.query({ active: true }, async (tabs) => {
        activeTab = tabs[0];
        if(/^(chrome:\/\/)/.test(activeTab.url)) {
            document.getElementById("toggle").classList.add("passive");
            return;
        }
        document.getElementById("toggle").addEventListener("click", () => {
            isDomainExcluded = !isDomainExcluded;
            document.getElementById("toggle").classList.toggle("passive");
            console.log(isDomainExcluded);
            chrome.runtime.sendMessage({
                type: "variable",
                name: "isDomainExcluded",
                accessor: "set",
                value: isDomainExcluded,
                tabId: activeTab.id,
                websiteUrl: new URL(activeTab.url).hostname,
            });
        });
        isDomainExcluded = await checkIsDomainExcluded();
        console.log(`isDomainExcluded: ${isDomainExcluded}`);
        if(isDomainExcluded === false) {
            addVideoCards();
        } else {
            document.getElementById("toggle").classList.add("passive");
        }
    });
}

main();