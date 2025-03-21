// Background script for message handling between popup and content scripts
chrome.runtime.onInstalled.addListener(() => {
  console.log('Receipt Entry Verifier extension installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Relay messages to popup if needed
  return true;
});