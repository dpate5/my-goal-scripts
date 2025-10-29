// Wait for Weglot to be fully initialized before setting up the observer
Weglot.on('initialized', function() {
  console.log("Weglot initialized event fired. Setting up video refresh observer.");

  // Function to refresh videos
  function refreshVideos3() {
    const iframes = document.querySelectorAll('.video-EN iframe, .video-FR iframe');
    iframes.forEach(function (iframe) {
      const originalSrc = iframe.getAttribute('src');
      // Check if src exists before setting it to avoid errors if iframe removed
      if (originalSrc) {
          iframe.setAttribute('src', originalSrc); // Refresh the iframe
          console.log('Video refreshed:', iframe.closest('div')?.getAttribute('class')); // Use optional chaining
      }
    });
  }

  // Function to set up the observer
  function setupObserver() {
    const targetNode = document.querySelector('aside.weglot_switcher');

    if (targetNode) {
      console.log('MutationObserver is set up for language changes.');
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          // Check specifically for the 'aria-label' attribute change on the switcher
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'aria-label' && 
              mutation.target === targetNode) {

            console.log('Language selection changed via aria-label.');
            refreshVideos3(); // Refresh videos on change
          }
        });
      });

      observer.observe(targetNode, { attributes: true, attributeFilter: ['aria-label'] }); // Observe only aria-label

    } else {
      // If the switcher isn't found even after Weglot initializes, log an error.
      console.error('Weglot switcher element (aside.weglot_switcher) not found even after Weglot initialized event. Cannot observe language changes.'); 
    }
  }

  // Alternative: Use Weglot's own language changed event - more reliable
  Weglot.on('languageChanged', function(newLang, prevLang) {
     console.log('Weglot languageChanged event fired.');
     refreshVideos3();
  });

  // We might not even need the observer now if languageChanged works reliably
  // setupObserver(); // You can try commenting this out if languageChanged works

});

// Log script load immediately
console.log("Weglot video script loaded, waiting for Weglot initialization event.");
