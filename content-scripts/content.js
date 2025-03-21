// Price Entry Verification Script

// Global variables to track price inputs
let totalSum = 0;
let itemCount = 0;
let displayDiv = null;

// Function to handle price input changes
function handlePriceInputChange(event) {
  calculateTotals();
}

// Function to calculate totals from all price inputs
function calculateTotals() {
  const priceInputs = document.querySelectorAll('input[data-type="price"].price');
  let sum = 0;
  let count = 0;

  priceInputs.forEach(input => {
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      sum += value;
      count++;
    }
  });

  totalSum = sum;
  itemCount = count;

  // Update the floating display
  updateFloatingDisplay();
  
  // Send data to popup if needed
  chrome.runtime.sendMessage({
    action: "updateTotals",
    data: { sum: totalSum.toFixed(2), count: itemCount }
  });
}

// Create and update floating display
function createFloatingDisplay() {
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
    minWidth: "180px"
  });

  // Add hover effect
  displayDiv.addEventListener('mouseover', () => {
    displayDiv.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
  });
  
  displayDiv.addEventListener('mouseout', () => {
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
    borderRadius: "4px"
  });
  
  toggleBtn.addEventListener('mouseover', () => {
    toggleBtn.style.backgroundColor = "#f3f4f6";
  });
  
  toggleBtn.addEventListener('mouseout', () => {
    toggleBtn.style.backgroundColor = "transparent";
  });
  
  let minimized = false;
  const content = document.createElement('div');
  content.id = 'price-sum-content';
  content.innerHTML = displayDiv.innerHTML;
  displayDiv.innerHTML = '';
  
  // Add heading for minimized state
  const heading = document.createElement('div');
  heading.style.fontWeight = "600";
  heading.style.color = "#4b5563";
  heading.style.fontSize = "15px";
  heading.style.paddingRight = "20px";
  heading.textContent = "Receipt Summary";
  
  displayDiv.appendChild(heading);
  displayDiv.appendChild(toggleBtn);
  displayDiv.appendChild(content);
  
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent dragging when clicking the button
    minimized = !minimized;
    content.style.display = minimized ? 'none' : 'block';
    toggleBtn.textContent = minimized ? "+" : "−";
    heading.style.display = minimized ? 'block' : 'none';
    displayDiv.style.width = minimized ? 'auto' : '';
  });
  
  // Hide heading initially
  heading.style.display = 'none';
  
  // Make the display draggable
  let isDragging = false;
  let offsetX, offsetY;

  displayDiv.addEventListener('mousedown', (e) => {
    // Ignore if clicking on the toggle button
    if (e.target === toggleBtn) return;
    
    isDragging = true;
    offsetX = e.clientX - displayDiv.getBoundingClientRect().left;
    offsetY = e.clientY - displayDiv.getBoundingClientRect().top;
    
    // Add active dragging style
    displayDiv.style.opacity = '0.92';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // Ensure it stays within the viewport
    const maxX = window.innerWidth - displayDiv.offsetWidth;
    const maxY = window.innerHeight - displayDiv.offsetHeight;
    
    displayDiv.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    displayDiv.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    
    // Remove the right/bottom positioning when manually positioned
    displayDiv.style.right = 'auto';
    displayDiv.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      displayDiv.style.opacity = '1';
      isDragging = false;
    }
  });
  
  document.body.appendChild(displayDiv);
}

// Update the floating display with new totals
function updateFloatingDisplay() {
  const countElement = document.getElementById('item-count');
  const totalElement = document.getElementById('price-total');
  
  if (countElement && totalElement) {
    countElement.textContent = itemCount;
    totalElement.textContent = totalSum.toFixed(2);
  }
}

// Initialize event listeners for price inputs
function initPriceTracking() {
  // Create the floating display
  createFloatingDisplay();
  
  // Add event listeners to existing price inputs
  const priceInputs = document.querySelectorAll('input[data-type="price"].price');
  priceInputs.forEach(input => {
    input.addEventListener('input', handlePriceInputChange);
    input.addEventListener('change', handlePriceInputChange);
  });
  
  // Set up mutation observer to detect new price inputs
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        const newInputs = mutation.addedNodes;
        newInputs.forEach(node => {
          if (node.nodeType === 1) { // ELEMENT_NODE
            const inputs = node.querySelectorAll ? 
              node.querySelectorAll('input[data-type="price"].price') : [];
            
            inputs.forEach(input => {
              input.addEventListener('input', handlePriceInputChange);
              input.addEventListener('change', handlePriceInputChange);
            });
          }
        });
      }
    });
    
    // Recalculate after DOM changes
    calculateTotals();
  });
  
  // Start observing the document
  observer.observe(document.body, { 
    childList: true,
    subtree: true
  });
  
  // Calculate initial totals
  calculateTotals();
}

// Message handler for communication with popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTotals") {
    // Send current totals back to popup
    sendResponse({
      data: {
        sum: totalSum.toFixed(2),
        count: itemCount
      }
    });
  }
  return true; // Required for asynchronous response
});

// Start the script when the page is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPriceTracking);
} else {
  initPriceTracking();
}