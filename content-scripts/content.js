

// Global variables to track price inputs
let totalSum = 0;
let itemCount = 0;
let displayDiv = null;
let extensionActive = true;

// Function to handle price input changes
function handlePriceInputChange(event) {
  if (!extensionActive) return;
  calculateTotals();
}

// Function to calculate totals from all price inputs
function calculateTotals() {
  try {
    // Initialize with an empty array to store all price inputs
    let priceInputs = [];

    // First check for explicitly marked price fields
    let explicitPriceInputs = document.querySelectorAll(
      'input[data-type="price"].price'
    );

    if (explicitPriceInputs.length > 0) {
      priceInputs = explicitPriceInputs;
    } else {
      // If none found, look for case-insensitive "price" in various attributes
      const allInputs = document.querySelectorAll("input");

      allInputs.forEach((input) => {
        // Check class
        if (
          input.className &&
          (input.className.includes("price") ||
            input.className.includes("Price") ||
            input.className.includes("PRICE"))
        ) {
          priceInputs.push(input);
          return;
        }

        // Check data-type
        if (
          input.dataset.type &&
          (input.dataset.type === "price" ||
            input.dataset.type === "Price" ||
            input.dataset.type === "PRICE")
        ) {
          priceInputs.push(input);
          return;
        }

        // Check name
        if (
          input.name &&
          (input.name.includes("price") ||
            input.name.includes("Price") ||
            input.name.includes("PRICE"))
        ) {
          priceInputs.push(input);
          return;
        }

        // Check id
        if (
          input.id &&
          (input.id.includes("price") ||
            input.id.includes("Price") ||
            input.id.includes("PRICE"))
        ) {
          priceInputs.push(input);
          return;
        }

        // Check placeholder
        if (
          input.placeholder &&
          (input.placeholder.includes("price") ||
            input.placeholder.includes("Price") ||
            input.placeholder.includes("PRICE"))
        ) {
          priceInputs.push(input);
          return;
        }
      });
    }

    let sum = 0;
    let count = 0;

    priceInputs.forEach((input) => {
      const value = parseFloat(input.value);
      if (!isNaN(value)) {
        sum += value;
        count++;
      }
    });

    totalSum = sum;
    itemCount = count;

    // Only show the floating display if price fields are detected
    if (priceInputs.length > 0) {
      showFloatingDisplay();
      updateFloatingDisplay();
    } else {
      hideFloatingDisplay();
    }

    // Send data to popup if needed - with error handling
    try {
      chrome.runtime.sendMessage({
        action: "updateTotals",
        data: { 
          sum: totalSum.toFixed(2), 
          count: itemCount,
          fieldsFound: priceInputs.length > 0 
        },
      }, response => {
        if (chrome.runtime.lastError) {
          // Extension context is invalidated, stop operations
          handleExtensionInvalidated();
        }
      });
    } catch (e) {
      // Handle extension context invalidation
      handleExtensionInvalidated();
    }
  } catch (e) {
    console.error("Price Sum extension error:", e);
    // If we get any error, disable the extension functionality
    handleExtensionInvalidated();
  }
}

// Handle when extension context is invalidated
function handleExtensionInvalidated() {
  extensionActive = false;
  
  // Remove event listeners
  const priceInputs = document.querySelectorAll('input');
  priceInputs.forEach(input => {
    input.removeEventListener('input', handlePriceInputChange);
    input.removeEventListener('change', handlePriceInputChange);
  });
  
  // Hide and remove the floating display
  if (displayDiv && displayDiv.parentNode) {
    displayDiv.parentNode.removeChild(displayDiv);
    displayDiv = null;
  }
}

// Create and update floating display
function createFloatingDisplay() {
  if (!extensionActive) return;
  
  // If display div already exists, don't create it again
  if (displayDiv) return;
  
  try {
    displayDiv = document.createElement("div");
    displayDiv.id = "price-sum-display";

    // Apply enhanced styling
    Object.assign(displayDiv.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      backgroundColor: "#ffffff",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      padding: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: "9999",
      fontSize: "14px",
      fontFamily: "'Segoe UI', Arial, sans-serif",
      cursor: "move",
      transition: "box-shadow 0.2s ease",
      minWidth: "180px",
      display: "none" // Initially hidden until price fields are found
    });

    // Add hover effect
    displayDiv.addEventListener("mouseover", () => {
      if (!extensionActive) return;
      displayDiv.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
    });

    displayDiv.addEventListener("mouseout", () => {
      if (!extensionActive) return;
      displayDiv.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    });

    displayDiv.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; font-size: 15px;">Receipt Summary</div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #4b5563;">Items:</span>
        <span id="item-count" style="font-weight: 500;">0</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding-top: 4px; border-top: 1px dashed #e5e7eb; margin-top: 4px;">
        <span style="color: #4b5563;">Total:</span>
        <span style="font-weight: 700; color: #1e40af;">$<span id="price-total">0.00</span></span>
      </div>
    `;

    // Add minimize/maximize button
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "−";

    Object.assign(toggleBtn.style, {
      position: "absolute",
      top: "8px",
      right: "8px",
      border: "none",
      background: "none",
      cursor: "pointer",
      fontSize: "16px",
      color: "#6b7280",
      fontWeight: "bold",
      width: "20px",
      height: "20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0",
      lineHeight: "1",
      borderRadius: "4px",
    });

    toggleBtn.addEventListener("mouseover", () => {
      if (!extensionActive) return;
      toggleBtn.style.backgroundColor = "#f3f4f6";
    });

    toggleBtn.addEventListener("mouseout", () => {
      if (!extensionActive) return;
      toggleBtn.style.backgroundColor = "transparent";
    });

    let minimized = false;
    const content = document.createElement("div");
    content.id = "price-sum-content";
    content.innerHTML = displayDiv.innerHTML;
    displayDiv.innerHTML = "";

    // Add heading for minimized state
    const heading = document.createElement("div");
    heading.style.fontWeight = "600";
    heading.style.color = "#4b5563";
    heading.style.fontSize = "15px";
    heading.style.paddingRight = "20px";
    heading.textContent = "Receipt Summary";

    displayDiv.appendChild(heading);
    displayDiv.appendChild(toggleBtn);
    displayDiv.appendChild(content);

    toggleBtn.addEventListener("click", (e) => {
      if (!extensionActive) return;
      e.stopPropagation(); // Prevent dragging when clicking the button
      minimized = !minimized;
      content.style.display = minimized ? "none" : "block";
      toggleBtn.textContent = minimized ? "+" : "−";
      heading.style.display = minimized ? "block" : "none";
      displayDiv.style.width = minimized ? "auto" : "";
    });

    // Hide heading initially
    heading.style.display = "none";

    // Make the display draggable
    let isDragging = false;
    let offsetX, offsetY;

    displayDiv.addEventListener("mousedown", (e) => {
      if (!extensionActive) return;
      // Ignore if clicking on the toggle button
      if (e.target === toggleBtn) return;

      isDragging = true;
      offsetX = e.clientX - displayDiv.getBoundingClientRect().left;
      offsetY = e.clientY - displayDiv.getBoundingClientRect().top;

      // Add active dragging style
      displayDiv.style.opacity = "0.92";
    });

    document.addEventListener("mousemove", (e) => {
      if (!extensionActive || !isDragging) return;

      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;

      // Ensure it stays within the viewport
      const maxX = window.innerWidth - displayDiv.offsetWidth;
      const maxY = window.innerHeight - displayDiv.offsetHeight;

      displayDiv.style.left = Math.max(0, Math.min(x, maxX)) + "px";
      displayDiv.style.top = Math.max(0, Math.min(y, maxY)) + "px";

      // Remove the right/bottom positioning when manually positioned
      displayDiv.style.right = "auto";
      displayDiv.style.bottom = "auto";
    });

    document.addEventListener("mouseup", () => {
      if (!extensionActive) return;
      if (isDragging) {
        displayDiv.style.opacity = "1";
        isDragging = false;
      }
    });

    document.body.appendChild(displayDiv);
  } catch (e) {
    console.error("Error creating floating display:", e);
    // If we get an error, disable extension functionality
    handleExtensionInvalidated();
  }
}

// Show the floating display
function showFloatingDisplay() {
  if (!extensionActive || !displayDiv) return;
  displayDiv.style.display = "block";
}

// Hide the floating display
function hideFloatingDisplay() {
  if (!extensionActive || !displayDiv) return;
  displayDiv.style.display = "none";
}

// Update the floating display with new totals
function updateFloatingDisplay() {
  if (!extensionActive || !displayDiv) return;
  
  try {
    const countElement = document.getElementById("item-count");
    const totalElement = document.getElementById("price-total");

    if (countElement && totalElement) {
      countElement.textContent = itemCount;
      totalElement.textContent = totalSum.toFixed(2);
    }
  } catch (e) {
    console.error("Error updating floating display:", e);
  }
}

// Initialize event listeners for price inputs
function initPriceTracking() {
  try {
    // Create the floating display (initially hidden)
    createFloatingDisplay();

    // Function to check if an input is a price field
    function isPriceField(input) {
      // Check class
      if (
        input.className &&
        (input.className.includes("price") ||
          input.className.includes("Price") ||
          input.className.includes("PRICE"))
      ) {
        return true;
      }

      // Check data-type
      if (
        input.dataset.type &&
        (input.dataset.type === "price" ||
          input.dataset.type === "Price" ||
          input.dataset.type === "PRICE")
      ) {
        return true;
      }

      // Check name
      if (
        input.name &&
        (input.name.includes("price") ||
          input.name.includes("Price") ||
          input.name.includes("PRICE"))
      ) {
        return true;
      }

      // Check id
      if (
        input.id &&
        (input.id.includes("price") ||
          input.id.includes("Price") ||
          input.id.includes("PRICE"))
      ) {
        return true;
      }

      // Check placeholder
      if (
        input.placeholder &&
        (input.placeholder.includes("price") ||
          input.placeholder.includes("Price") ||
          input.placeholder.includes("PRICE"))
      ) {
        return true;
      }

      return false;
    }

    // Add event listeners to existing price inputs
    const allInputs = document.querySelectorAll("input");
    let priceFieldsFound = false;
    
    allInputs.forEach((input) => {
      if (isPriceField(input)) {
        priceFieldsFound = true;
        input.addEventListener("input", handlePriceInputChange);
        input.addEventListener("change", handlePriceInputChange);
      }
    });

    // Only show the display if price fields were found
    if (priceFieldsFound) {
      showFloatingDisplay();
    } else {
      hideFloatingDisplay();
    }

    // Set up mutation observer to detect new price inputs
    const observer = new MutationObserver((mutations) => {
      if (!extensionActive) {
        observer.disconnect();
        return;
      }
      
      let newPriceFieldsAdded = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          const newNodes = mutation.addedNodes;
          newNodes.forEach((node) => {
            if (node.nodeType === 1) { // ELEMENT_NODE
              // Check if the node itself is an input and a price field
              if (node.nodeName === 'INPUT' && isPriceField(node)) {
                node.addEventListener("input", handlePriceInputChange);
                node.addEventListener("change", handlePriceInputChange);
                newPriceFieldsAdded = true;
              }
              
              // Check children nodes
              const inputs = node.querySelectorAll ? node.querySelectorAll("input") : [];
              inputs.forEach((input) => {
                if (isPriceField(input)) {
                  input.addEventListener("input", handlePriceInputChange);
                  input.addEventListener("change", handlePriceInputChange);
                  newPriceFieldsAdded = true;
                }
              });
            }
          });
        }
      });

      // Recalculate after DOM changes
      if (newPriceFieldsAdded) {
        calculateTotals();
      }
    });

    // Start observing the document
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Calculate initial totals
    calculateTotals();
    
    // Add error handling to chrome runtime
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!extensionActive) return false;
      
      try {
        if (message.action === "getTotals") {
          // Check if any price fields exist
          const priceInputs = document.querySelectorAll(
            'input[data-type="price"].price, input[class*="price"], input[id*="price"], input[name*="price"], input[placeholder*="price"]'
          );
          
          // Send current totals back to popup
          sendResponse({
            data: {
              sum: totalSum.toFixed(2),
              count: itemCount,
              fieldsFound: priceInputs.length > 0
            },
          });
        }
        return true; // Required for asynchronous response
      } catch (e) {
        handleExtensionInvalidated();
        return false;
      }
    });
    
  } catch (e) {
    console.error("Error initializing price tracking:", e);
    handleExtensionInvalidated();
  }
}

// Add a listener to detect extension invalidation early
try {
  chrome.runtime.onMessage.addListener(function() {
    // This will throw if context is invalidated
    if (chrome.runtime.id) {
      return true;
    }
  });
} catch (e) {
  // Extension context already invalidated
  handleExtensionInvalidated();
}

// Start the script when the page is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function() {
    if (extensionActive) {
      initPriceTracking();
    }
  });
} else {
  if (extensionActive) {
    initPriceTracking();
  }
}