// Variables to store totals
let currentTotal = 0;
let itemCount = 0;

// Function to update the display with current totals
function updateDisplay() {
  const countElement = document.getElementById("item-count");
  const totalElement = document.getElementById("price-total");

  if (countElement && totalElement) {
    countElement.textContent = itemCount;
    totalElement.textContent = currentTotal.toFixed(2);
    console.log(`Updated display: ${itemCount} items, $${currentTotal.toFixed(2)}`);
  } else {
    console.error("Display elements not found");
  }
}

// Function to verify the total against expected value
function verifyTotal() {
  const expectedTotalInput = document.getElementById("expected-total");
  const resultElement = document.getElementById("verification-result");

  if (!expectedTotalInput || !resultElement) {
    console.error("Required DOM elements not found");
    return;
  }

  const expectedTotal = parseFloat(expectedTotalInput.value);

  if (isNaN(expectedTotal)) {
    resultElement.innerHTML = "Please enter a valid expected total";
    resultElement.style.color = "orange";
    return;
  }

  const difference = Math.abs(currentTotal - expectedTotal);
  console.log(`Verifying: Current=$${currentTotal.toFixed(2)}, Expected=$${expectedTotal.toFixed(2)}, Diff=$${difference.toFixed(2)}`);

  if (difference < 0.01) {
    resultElement.innerHTML = "✓ Totals match!";
    resultElement.style.color = "green";
  } else {
    resultElement.innerHTML = `✗ Difference: $${difference.toFixed(2)}`;
    resultElement.style.color = "red";
  }
}

// Function to reset values
function resetValues() {
  const expectedTotalInput = document.getElementById("expected-total");
  const resultElement = document.getElementById("verification-result");

  if (expectedTotalInput) expectedTotalInput.value = "";
  if (resultElement) resultElement.innerHTML = "";
}

// Get current tab to communicate with content script
async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  } catch (error) {
    console.error("Error getting current tab:", error);
    return null;
  }
}

// Request data from content script
function requestDataFromContentScript() {
  console.log("Requesting data from content script...");
  
  getCurrentTab().then(tab => {
    if (!tab) {
      console.error('No active tab found');
      updateStatusMessage("No active tab found", "red");
      return;
    }
    
    console.log(`Sending message to tab ${tab.id}`);
    
    chrome.tabs.sendMessage(
      tab.id, 
      { action: "getTotals" }, 
      function(response) {
        if (chrome.runtime.lastError) {
          console.error("Communication error:", chrome.runtime.lastError.message);
          updateStatusMessage("Error connecting to page. Make sure you're on a page with price inputs.", "red");
          return;
        }
        
        console.log("Response received:", response);
        
        if (response && response.data) {
          currentTotal = parseFloat(response.data.sum) || 0;
          itemCount = parseInt(response.data.count) || 0;
          console.log(`Received data: ${itemCount} items, $${currentTotal.toFixed(2)}`);
          updateDisplay();
        } else {
          console.warn("Invalid or empty response from content script");
          updateStatusMessage("No price data found on this page", "orange");
        }
      }
    );
  }).catch(error => {
    console.error("Error in getCurrentTab:", error);
    updateStatusMessage("Error accessing tab information", "red");
  });
}

// Helper function to show status messages
function updateStatusMessage(message, color) {
  const resultElement = document.getElementById("verification-result");
  if (resultElement) {
    resultElement.innerHTML = message;
    resultElement.style.color = color || "black";
  }
}

// Initialize the popup
document.addEventListener("DOMContentLoaded", function() {
  console.log("Popup loaded");
  
  // Set up button listeners
  const verifyBtn = document.getElementById("verify-btn");
  const resetBtn = document.getElementById("reset-btn");
  const refreshBtn = document.getElementById("refresh-btn");

  if (verifyBtn) {
    verifyBtn.addEventListener("click", verifyTotal);
    console.log("Verify button listener added");
  }
  
  if (resetBtn) {
    resetBtn.addEventListener("click", resetValues);
    console.log("Reset button listener added");
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener("click", requestDataFromContentScript);
    console.log("Refresh button listener added");
  }

  // Initialize display with zeros
  updateDisplay();
  
  // Request current values from content script
  requestDataFromContentScript();
});

// Listen for updates from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in popup:", message);
  
  try {
    if (message.action === "updateTotals" && message.data) {
      currentTotal = parseFloat(message.data.sum) || 0;
      itemCount = parseInt(message.data.count) || 0;
      console.log(`Updating from message: ${itemCount} items, $${currentTotal.toFixed(2)}`);
      updateDisplay();
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
  return true;
});