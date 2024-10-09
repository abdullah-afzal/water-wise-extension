chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    remindersEnabled: true,
    glassSize: 250,
    quantity: 2,
    startTime: "09:00",
    endTime: "21:00"
  }, () => {
    setReminderAlarms();
  });
});

function setReminderAlarms() {
  chrome.storage.sync.get(["remindersEnabled", "glassSize", "quantity", "startTime", "endTime"], (data) => {
    if (data.remindersEnabled) {
      const totalWaterInMl = data.quantity * 1000;
      const glassSize = data.glassSize;
      const numberOfReminders = Math.floor(totalWaterInMl / glassSize);

      chrome.alarms.clearAll();

      const startTime = data.startTime.split(":");
      const endTime = data.endTime.split(":");

      const startHour = parseInt(startTime[0]);
      const startMinute = parseInt(startTime[1]);
      const endHour = parseInt(endTime[0]);
      const endMinute = parseInt(endTime[1]);

      let currentHour = startHour;
      let currentMinute = startMinute;

      for (let i = 0; i < numberOfReminders; i++) {
        if (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
          const alarmTime = new Date();
          alarmTime.setHours(currentHour);
          alarmTime.setMinutes(currentMinute);
          alarmTime.setSeconds(0);
          console.log(`Creating alarm for: ${alarmTime}`);
          chrome.alarms.create(`drinkWaterAlarm${i}`, { when: alarmTime.getTime() });
        }
        currentMinute += 120;
        if (currentMinute >= 60) {
          currentMinute -= 60;
          currentHour++;
        }
      }
    }
  });
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateReminders") {
    setReminderAlarms();
  }
});

// Call to set alarms on update
chrome.runtime.onUpdateAvailable.addListener(setReminderAlarms);

chrome.alarms.onAlarm.addListener((alarm) => {
  
  if (alarm.name.startsWith("drinkWaterAlarm")) {
    chrome.storage.sync.get(["remindersEnabled"], (data) => {
      if (data.remindersEnabled) {
        chrome.notifications.create({
          type: "basic",
          silent: false,
          iconUrl: "static/icons/water.png",
          title: "Hydration Reminder",
          message: "Don't forget to drink water!",
          priority: 2,
          buttons: [
            { title: "I drank water" },
            { title: "Snooze" }
          ]
        });
      }
    });
  }
  else if (alarm.name.startsWith("drinkWaterSnooze")) {
    
    chrome.storage.sync.get(["remindersEnabled"], (data) => {
      if (data.remindersEnabled) {
        
        chrome.notifications.create({
          type: "basic",
          silent: false,
          iconUrl: "static/icons/water.png",
          title: "Hydration Reminder (Snoozed)",
          message: "You are already one glass late!",
          priority: 2,
          buttons: [
            { title: "I drank water" },
            { title: "Snooze Again" }
          ]
        });
      }
    });
  }
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // Handle drink water action
  } else if (buttonIndex === 1) {
    chrome.alarms.create("drinkWaterSnooze", { delayInMinutes: 5 });
  }
});
