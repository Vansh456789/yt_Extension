document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length || !tabs[0].url.includes("youtube.com/watch")) {
          console.error("Not a YouTube video.");
          return;
      }

      let videoId = new URL(tabs[0].url).searchParams.get("v");
      if (videoId) {
          displayTimestamps(videoId);
          setupSaveButton(videoId);
      }
  });

  document.body.addEventListener("click", (event) => {
      event.stopPropagation(); 
  });
});

function setupSaveButton(videoId) {
  document.getElementById("saveTimestamp").addEventListener("click", () => {
      let note = document.getElementById("noteInput").value.trim();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (!tabs.length) {
              console.error("No active tab found.");
              return;
          }

          chrome.scripting.executeScript(
              {
                  target: { tabId: tabs[0].id },
                  function: getCurrentTimestamp,
              },
              (result) => {
                  if (!result || !result[0] || result[0].result === undefined) {
                      console.error("Could not retrieve timestamp.");
                      return;
                  }

                  let { time } = result[0].result;
                  saveTimestamp(videoId, time, note);
              }
          );
      });
  });
}

function getCurrentTimestamp() {
  let video = document.querySelector("video");
  return video ? { time: video.currentTime } : { time: null };
}

function saveTimestamp(videoId, time, note) {
  if (time === null) {
      console.error("Invalid timestamp.");
      return;
  }

  chrome.storage.sync.get({ timestamps: {} }, (data) => {
      let timestamps = data.timestamps || {};
      if (!timestamps[videoId]) {
          timestamps[videoId] = [];
      }

      timestamps[videoId].push({ time, note });

      chrome.storage.sync.set({ timestamps }, () => {
          console.log("Timestamp saved successfully!");
          displayTimestamps(videoId);
      });
  });
}

function displayTimestamps(videoId) {
  chrome.storage.sync.get({ timestamps: {} }, (data) => {
      let timestamps = data.timestamps[videoId] || [];
      let list = document.getElementById("timestampsList");
      list.innerHTML = "";

      timestamps.forEach((entry) => {
          let li = document.createElement("li");
          let timestampButton = document.createElement("button");

          timestampButton.textContent = `⏳ ${formatTime(entry.time)} - ${entry.note || "No note"}`;
          timestampButton.style.display = "block";


          timestampButton.style.borderRadius = "10px"; 
          timestampButton.style.transition = "background 0.3s ease"; 

          timestampButton.addEventListener("mouseover", () => {
          timestampButton.style.background =rgb(245, 158, 59); 
          });

          timestampButton.addEventListener("mouseout", () => {
          timestampButton.style.background =rgb(247, 169, 52); 
          });
          
          timestampButton.style.width = "100%";
          timestampButton.style.margin = "5px 0";
          timestampButton.style.background = "#ff9800";
          timestampButton.style.color = "#fff";
          timestampButton.style.border = "none";
          timestampButton.style.padding = "5px";
          timestampButton.style.cursor = "pointer";

          timestampButton.addEventListener("click", () => {
              seekToTimestamp(entry.time);
          });

          li.appendChild(timestampButton);
          list.appendChild(li);
      });
  });
}

function seekToTimestamp(time) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (time) => {
              let video = document.querySelector("video");
              if (video) video.currentTime = time;
          },
          args: [time]
      });
  });
}

function formatTime(seconds) {
  let mins = Math.floor(seconds / 60);
  let secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}
