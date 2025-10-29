document.addEventListener("DOMContentLoaded", function () {
  // --- Element Selectors ---
  const startCameraButton = document.getElementById('start-camera-button');
  const captureButton = document.getElementById('capture-button');
  const webcamContainer = document.getElementById('webcam-container');
  const webcamFeedContainer = document.getElementById('webcam-feed'); // This is the DIV
  const snapPhotoButton = document.getElementById('snap-photo-button');
  const cancelWebcamButton = document.getElementById('cancel-webcam-button');
  const retakeButton = document.getElementById('retake-button');
  const hiddenFileInput = document.getElementById('hidden-file-input');
  const imagePreview = document.getElementById('image-preview');
  const statusMessage = document.getElementById('status-message');

  // --- State Variables ---
  let capturedFileObject = null;
  let capturedImageBase64 = null; // ADDED: To store the Base64 string
  let objectUrl = null;
  let webcamStream = null;
  const LIVE_VIDEO_ID = 'my-live-video-feed';

  // --- Helper Functions ---
  function showInitialChoice() {
    if (startCameraButton) startCameraButton.style.display = 'block';
    if (captureButton) captureButton.style.display = 'block';
    if (webcamContainer) webcamContainer.style.display = 'none';
    if (imagePreview) imagePreview.style.display = 'none';
    if (retakeButton) retakeButton.style.display = 'none';
    if (statusMessage) statusMessage.textContent = 'Please provide an image.';
  }

  function showWebcamView() {
    if (startCameraButton) startCameraButton.style.display = 'none';
    if (captureButton) captureButton.style.display = 'none';
    if (webcamContainer) webcamContainer.style.display = 'block';
    if (statusMessage) statusMessage.textContent = 'Position healthcard in the frame.';
  }

  function showPreviewView() {
    if (webcamContainer) webcamContainer.style.display = 'none';
    if (imagePreview) imagePreview.style.display = 'block';
    if (retakeButton) retakeButton.style.display = 'block';
    if (startCameraButton) startCameraButton.style.display = 'none';
    if (captureButton) captureButton.style.display = 'none';
  }

  function stopWebcam() {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      webcamStream = null;
    }
    const existingVideo = document.getElementById(LIVE_VIDEO_ID);
    if (existingVideo) {
        existingVideo.remove();
    }
    showInitialChoice();
  }
 
  // UPDATED: resetImageState now clears Base64 data as well
  function resetImageState() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    capturedFileObject = null;
    capturedImageBase64 = null; // Clear Base64 data
    if (imagePreview) {
      imagePreview.src = '';
      imagePreview.style.display = 'none';
    }
    if (retakeButton) retakeButton.style.display = 'none';
    // Clear both Wized variables
    if (window.Wized && Wized.data && Wized.data.v) {
      Wized.data.v.wizedFileObjectForUpload = null;
      Wized.data.v.imageBase64WizedVar = null; 
    }
  }

  // --- Event Listeners ---
  if (startCameraButton) {
    startCameraButton.addEventListener('click', async () => {
      resetImageState();
      showWebcamView();

      try {
        if (!webcamFeedContainer) {
            throw new Error("The container div '#webcam-feed' was not found.");
        }
       
        webcamFeedContainer.innerHTML = '';
       
        const videoEl = document.createElement('video');
        videoEl.id = LIVE_VIDEO_ID;
        videoEl.style.width = "100%";
        videoEl.style.height = "100%";
        videoEl.setAttribute('autoplay', '');
        videoEl.setAttribute('playsinline', '');
       
        webcamFeedContainer.appendChild(videoEl);

        const constraints = {
            video: { facingMode: 'environment' }, // Use 'environment' for the back camera
            audio: false
        };
        webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoEl.srcObject = webcamStream;

      } catch (err) {
        console.error("Error accessing webcam:", err);
        if (statusMessage) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                statusMessage.textContent = "Camera access denied. Please allow permission in your browser.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                statusMessage.textContent = "No camera found. Please ensure a webcam is connected.";
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                statusMessage.textContent = "Your camera is already in use by another application.";
            } else {
                statusMessage.textContent = `Error: ${err.message}`;
            }
        }
        if (webcamContainer) webcamContainer.style.display = 'none';
        if (startCameraButton) startCameraButton.style.display = 'block';
        if (captureButton) captureButton.style.display = 'block';
      }
    });
  }

  // UPDATED: snapPhotoButton now also converts the snapped photo to Base64
  if (snapPhotoButton) {
    snapPhotoButton.addEventListener('click', () => {
      const webcamFeed = document.getElementById(LIVE_VIDEO_ID);

      if (!webcamFeed) {
        console.error("Error: Could not find the live video feed to snap a photo.");
        if (statusMessage) statusMessage.textContent = "A critical error occurred. Please refresh and try again.";
        return;
      }
     
      const canvas = document.createElement('canvas');
      canvas.width = webcamFeed.videoWidth;
      canvas.height = webcamFeed.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(webcamFeed, 0, 0, canvas.width, canvas.height);
     
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
      }
     
      canvas.toBlob(function(blob) {
        // Store the File object
        capturedFileObject = new File([blob], "healthcard-photo.png", { type: "image/png" });
        
        // Set up the preview
        objectUrl = URL.createObjectURL(capturedFileObject);
        if (imagePreview) imagePreview.src = objectUrl;
        if (statusMessage) statusMessage.textContent = "Processing image...";
        showPreviewView();

        // --- ADDED: Convert the blob to Base64 ---
        const reader = new FileReader();
        reader.onload = function(e) {
            capturedImageBase64 = e.target.result;
            if (window.Wized && Wized.data && Wized.data.v) {
                Wized.data.v.imageBase64WizedVar = capturedImageBase64;
            }
            if (statusMessage) statusMessage.textContent = "Photo captured. Ready to proceed.";
        };
        reader.onerror = function(error) {
            console.error("FileReader Error:", error);
            if (statusMessage) statusMessage.textContent = "Error processing captured photo.";
        };
        reader.readAsDataURL(capturedFileObject); // Read the blob as a Base64 string

      }, 'image/png');
    });
  }
  
  if (cancelWebcamButton) {
    cancelWebcamButton.addEventListener('click', stopWebcam);
  }

  if (retakeButton) {
    retakeButton.addEventListener('click', () => {
      // Use startCameraButton.click() to restart the camera flow
      // Or just reset to initial choice if you want them to choose again.
      showInitialChoice();
      resetImageState();
    });
  }

  if (captureButton) {
    captureButton.addEventListener('click', () => {
      if (hiddenFileInput) hiddenFileInput.click();
    });
  }

  // UPDATED: hiddenFileInput listener now includes the Base64 conversion logic
  if (hiddenFileInput) {
    hiddenFileInput.addEventListener('change', function(event) {
      resetImageState();
      
      const file = event.target.files[0];
      if (file) {
        // --- PNG Validation from our previous discussion ---
        if (file.type !== 'image/png') {
          if (statusMessage) statusMessage.textContent = "Invalid file format. Please upload a PNG image.";
          showInitialChoice();
          event.target.value = null; // Clear the invalid file
          return; 
        }

        // Store the File object and set up preview
        capturedFileObject = file;
        objectUrl = URL.createObjectURL(file);
        if (imagePreview) imagePreview.src = objectUrl;
        if (statusMessage) statusMessage.textContent = "Processing image...";
        showPreviewView();

        // --- ADDED: Convert the file to Base64 ---
        const reader = new FileReader();
        reader.onload = function(e) {
            capturedImageBase64 = e.target.result;
            if (window.Wized && Wized.data && Wized.data.v) {
                Wized.data.v.imageBase64WizedVar = capturedImageBase64;
            }
            if (statusMessage) statusMessage.textContent = "Image selected. Ready to proceed.";
        };
        reader.onerror = function(error) {
            console.error("FileReader Error:", error);
            if(statusMessage) statusMessage.textContent = "Error processing image.";
            resetImageState();
            showInitialChoice();
        };
        reader.readAsDataURL(file);

      } else {
        showInitialChoice();
      }
      event.target.value = null;
    });
  }

  // This function prepares the raw file object for upload, which is generally more efficient.
  function prepareWizedUploadData() {
    if (!window.Wized || !Wized.data || !Wized.data.v) {
      if (statusMessage) statusMessage.textContent = "Error: Wized data context not found.";
      return false;
    }
    if (capturedFileObject) {
      Wized.data.v.wizedFileObjectForUpload = capturedFileObject;
      if (statusMessage) statusMessage.textContent = "Image data processed.";
      return true;
    } else {
      Wized.data.v.wizedFileObjectForUpload = null;
      if (statusMessage) statusMessage.textContent = "No image available to prepare for upload.";
      return false;
    }
  }

  // --- Expose function to Wized & handle phone inputs ---
  window.myOnboardingFunctions = window.myOnboardingFunctions || {};
  window.myOnboardingFunctions.prepareDataForPage1Upload = prepareWizedUploadData;

  const phoneInputs = document.querySelectorAll('input[wized="phone"]');
  phoneInputs.forEach(function (input) {
    input.addEventListener("input", function (e) {
      const cleaned = this.value.replace(/[^0-9]/g, "");
      if (this.value !== cleaned) {
        this.value = cleaned;
      }
    });
  });

});