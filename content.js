chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTimestamp") {
        let video = document.querySelector("video");
        let videoId = new URL(window.location.href).searchParams.get("v");
        if (video && videoId) {
            sendResponse({ time: video.currentTime, videoId: videoId });
        } else {
            sendResponse({ time: null, videoId: null });
        }
    }
});
