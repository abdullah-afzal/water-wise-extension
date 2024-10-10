// When extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  initializeReminderSettings();
});

// When the extension is restarted or the browser is reopened
chrome.runtime.onStartup.addListener(() => {
  checkAndSetDailyAlarms();
});

// Initialize reminder settings and set daily alarms
function initializeReminderSettings() {
  chrome.storage.sync.set({
    remindersEnabled: true,
    glassSize: 250,
    quantity: 2,
    startTime: "09:00",
    endTime: "21:00"
  }, () => {
    setReminderAlarms();
    createMidnightAlarm();
  });
}

// Set a repeating alarm that checks for reminders at 00:00 daily
function createMidnightAlarm() {
  chrome.alarms.create('dailyReminderCheck', {
    when: getMidnightTimestamp(),  // Set alarm for the next midnight
    periodInMinutes: 1440  // 1440 minutes = 24 hours
  });
}

// Get the timestamp for the next midnight (00:00)
function getMidnightTimestamp() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return midnight.getTime();
}

// Check if today's alarms are set, and set them if needed
function checkAndSetDailyAlarms() {
  const today = new Date().toLocaleDateString();
  chrome.storage.local.get('lastAlarmSetDate', (data) => {
    if (data.lastAlarmSetDate !== today) {
      setReminderAlarms();
    }
  });
}

// Set reminder alarms based on user settings
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

      // Store today's date as the last alarm setup date
      const today = new Date().toLocaleDateString();
      chrome.storage.local.set({ lastAlarmSetDate: today });
    }
  });
}

// Listen for the daily 00:00 alarm and reset reminders for the new day
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReminderCheck') {
    checkAndSetDailyAlarms();
  } else if (alarm.name.startsWith("drinkWaterAlarm")) {
    sendReminderNotification();
  } else if (alarm.name === 'drinkWaterSnooze') {
    sendSnoozeNotification();
  }
});

function sendReminderNotification() {
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

function sendSnoozeNotification() {
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

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // Handle drink water action
  } else if (buttonIndex === 1) {
    chrome.alarms.create("drinkWaterSnooze", { delayInMinutes: 5 });
  }
});
