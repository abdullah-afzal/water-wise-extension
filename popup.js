document.addEventListener("DOMContentLoaded", () => {
    const messages = [
        "Stay hydrated, it's good for your skin!",
        "Drinking water can help you lose weight.",
        "Water helps maintain the balance of bodily fluids.",
        "Drinking water before meals can help you eat less.",
        "Stay sharp, drink water regularly!",
        "Water is essential for your body's detoxification process.",
        "Feeling tired? A glass of water might help!",
        "Hydrate to elevate your mood!",
        "Drinking water can improve physical performance.",
        "Remember, every glass counts towards your hydration goals!"
    ];

    // Function to display a random message
    function displayRandomMessage() {
        const randomIndex = Math.floor(Math.random() * messages.length);
        const messageElement = document.getElementById('hydrationMessage');
        messageElement.textContent = messages[randomIndex];
    }

    displayRandomMessage();
    const toggleBtn = document.getElementById("switch");
    const settingsBtn = document.getElementById("settingsBtn");
    const backBtn = document.getElementById("backBtn");
    const reminderView = document.getElementById("reminderView");
    const settingsView = document.getElementById("settingsView");
    const landingView = document.getElementById("landingView");
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");

    // Get saved settings from storage and set the UI accordingly
    chrome.storage.sync.get(["remindersEnabled", "glassSize", "quantity", "startTime", "endTime"], (data) => {
        if (data.remindersEnabled) {
            toggleBtn.checked = true;
            reminderView.style.display = "block";
        } else {
            toggleBtn.checked = false;
            reminderView.style.display = "none";
        }

        // Set stored values or defaults
        document.getElementById("glassSize").value = data.glassSize || 250;
        document.getElementById("quantity").value = data.quantity || 2;
        document.getElementById("startTime").value = data.startTime || "09:00";
        document.getElementById("endTime").value = data.endTime || "21:00";
    });

    // Toggle button functionality
    toggleBtn.addEventListener("change", () => {
        const isChecked = toggleBtn.checked;
        chrome.storage.sync.set({ remindersEnabled: isChecked }, () => {
            // Send message to background.js to update alarms based on toggle state
            chrome.runtime.sendMessage({ action: "updateReminders" });
        });

        if (isChecked) {
            reminderView.style.display = "block";
        } else {
            reminderView.style.display = "none";
        }
    });

    // Settings button functionality
    settingsBtn.addEventListener("click", () => {
        settingsView.style.display = "block";
        landingView.style.display = "none";
        backBtn.style.display = "block";
    });

    // Back button functionality
    backBtn.addEventListener("click", () => {
        settingsView.style.display = "none";
        backBtn.style.display = "none";
        landingView.style.display = "block";
    });

    // Save settings button functionality
    saveSettingsBtn.addEventListener("click", () => {
        const glassSize = document.getElementById("glassSize").value;
        const quantity = document.getElementById("quantity").value;
        const startTime = document.getElementById("startTime").value;
        const endTime = document.getElementById("endTime").value;

        chrome.storage.sync.set({ glassSize, quantity, startTime, endTime }, () => {
            settingsView.style.display = "none";
            backBtn.style.display = "none";
            landingView.style.display = "block";
            // Send message to background.js to update alarms with new settings
            chrome.runtime.sendMessage({ action: "updateReminders" });
        });
    });

    // Function to update reminder message
    function updateReminderMessage() {
        const reminderMessage = document.getElementById("reminderMessage");

        chrome.alarms.getAll((alarms) => {
            const nextAlarm = alarms.find(alarm => alarm.name.startsWith('drinkWaterAlarm'));
            if (nextAlarm) {
                const nextReminderTime = new Date(nextAlarm.scheduledTime);
                const now = new Date();
                const timeLeft = (nextReminderTime - now) / 1000;

                const hours = Math.floor(timeLeft / 3600);
                const minutes = Math.floor((timeLeft % 3600) / 60);
                const seconds = Math.floor(timeLeft % 60);

                reminderMessage.innerHTML = `<p>Next reminder in </p><p id="reminderTime"> ${hours} : ${minutes} : ${seconds}</p>`;
            } else {
                reminderMessage.textContent = "No active reminders.";
            }
        });
    }

    // Update the reminder message every second
    setInterval(updateReminderMessage, 1000);
});
