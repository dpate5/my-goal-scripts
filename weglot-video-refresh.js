document.addEventListener("DOMContentLoaded", function () {
  console.log("Weglot video script loaded.");

  // Function to refresh videos
  function refreshVideos3() {
    const iframes = document.querySelectorAll('.video-EN iframe, .video-FR iframe');
    iframes.forEach(function (iframe) {
      const originalSrc = iframe.getAttribute('src');
      iframe.setAttribute('src', originalSrc); // Refresh the iframe
      console.log('Video refreshed:', iframe.closest('div').getAttribute('class'));
    });
  }

  // Function to set up the observer
  function setupObserver() {
    const targetNode = document.querySelector('aside.weglot_switcher');

    if (targetNode) {
      console.log('MutationObserver is set up for language changes.');
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'aria-label') {
            console.log('Language selection changed.');
            refreshVideos3(); // Refresh videos on change
          }
        });
      });

      observer.observe(targetNode, { attributes: true });
    } else {
      console.log('Weglot switcher not found. Retrying...');
      setTimeout(setupObserver, 1000); // Retry after 1 second
    }
  }

  setupObserver(); // Start the observer
});
