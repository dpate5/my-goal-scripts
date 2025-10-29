function initializeDobPicker() {
  let attempts = 0;
  const maxAttempts = 20; // Try for 2 seconds total

  const intervalId = setInterval(function() {
    const dobInput = document.getElementById("dob-picker");

    if (dobInput) {
      clearInterval(intervalId);
      // Check if flatpickr hasn't already been initialized on this element
      if (!dobInput._flatpickr) { 
        console.log("Initializing flatpickr on #dob-picker");
        dobInput.readOnly = true; // Make input read-only
        flatpickr(dobInput, {
          dateFormat: "Y-m-d", // Format date as YYYY-MM-DD
          maxDate: "today", // Don't allow future dates
          defaultDate: "2000-01-01" // Sensible default
        });
      }
      return; // Exit function once initialized or found
    }

    attempts++;
    if (attempts >= maxAttempts) {
      clearInterval(intervalId); // Stop trying after max attempts
      console.error("Could not find #dob-picker element after multiple attempts.");
    }
  }, 100); // Check every 100ms
}

// --- Observe the modal ---
const modalSelector = '#Pop-up-Wrapper'; 
const targetNode = document.querySelector(modalSelector);

if (targetNode) {
  console.log("Setting up MutationObserver for modal:", modalSelector);
  const observer = new MutationObserver(function(mutationsList, observer) {
    // Check if the modal's display style is not 'none'
    const isVisible = window.getComputedStyle(targetNode).display !== 'none';

    if (isVisible) {
      console.log("Modal is visible, initializing DOB picker.");
      initializeDobPicker(); // Initialize the date picker
      observer.disconnect(); // Stop observing once the modal is shown
    }
  });

  // Start observing the modal for attribute changes (like style or class)
  observer.observe(targetNode, { attributes: true });

  // Also check immediately in case the modal is already visible on page load
  if (window.getComputedStyle(targetNode).display !== 'none') {
    console.log("Modal already visible on load, initializing DOB picker.");
    initializeDobPicker();
    observer.disconnect();
  }

} else {
  console.error("Could not find the modal element:", modalSelector);
}
