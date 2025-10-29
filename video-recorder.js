document.addEventListener("DOMContentLoaded", function () {
  // --- Element Selectors (Video Only) ---
  const startVideoButton = document.getElementById('start-video-button');
  const startRecordingButton = document.getElementById('start-recording-button');
  const stopRecordingButton = document.getElementById('stop-recording-button');
  const retakeVideoButton = document.getElementById('retake-video-button');
  const uploadVideoButton = document.getElementById('upload-video');
  const videoPreview = document.getElementById('video-preview');

  const webcamContainer = document.getElementById('webcam-container');
  const webcamFeedContainer = document.getElementById('webcam-feed');
  const cancelWebcamButton = document.getElementById('cancel-webcam-button');
  const statusMessage = document.getElementById('status-message');

  // --- State Variables ---
  let webcamStream = null;
  let objectUrl = null;
  const LIVE_VIDEO_ID = 'my-live-video-feed';
  let mediaRecorder = null;
  let recordedChunks = [];
  let capturedVideoFile = null;

  // State for timer
  let timerInterval = null;
  let secondsElapsed = 0;

  // --- UI Helper Functions ---
  function showInitialChoice() {
    if (startVideoButton) startVideoButton.style.display = 'block';
    if (webcamContainer) webcamContainer.style.display = 'none';
    if (videoPreview) videoPreview.style.display = 'none';
    if (startRecordingButton) startRecordingButton.style.display = 'none';
    if (stopRecordingButton) stopRecordingButton.style.display = 'none';
    if (retakeVideoButton) retakeVideoButton.style.display = 'none';
    if (uploadVideoButton) uploadVideoButton.style.display = 'none';
    if (statusMessage) statusMessage.textContent = 'Click Start Video to begin.';
  }

  function showWebcamView() {
    if (webcamContainer) webcamContainer.style.display = 'block';
    if (startRecordingButton) startRecordingButton.style.display = 'block';
    if (startVideoButton) startVideoButton.style.display = 'none';
    if (stopRecordingButton) stopRecordingButton.style.display = 'none';
    if (statusMessage) statusMessage.textContent = 'Ready to record video.';
  }

  function showVideoPreviewView() {
    if (videoPreview) {
        videoPreview.style.display = 'block';
        videoPreview.controls = true;
    }
    if (retakeVideoButton) retakeVideoButton.style.display = 'block';
    if (uploadVideoButton) uploadVideoButton.style.display = 'block';
    if (webcamContainer) webcamContainer.style.display = 'none';
    if (startVideoButton) startVideoButton.style.display = 'none';
    if (startRecordingButton) startRecordingButton.style.display = 'none';
    if (stopRecordingButton) stopRecordingButton.style.display = 'none';
    if (statusMessage) statusMessage.textContent = "Video captured. Ready to upload.";
  }

  // --- Timer and Countdown Functions ---
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    secondsElapsed = 0;
    if (statusMessage) {
        statusMessage.innerHTML = `<span class="blinking-dot"></span>Recording... ${formatTime(secondsElapsed)}`;
    }
    timerInterval = setInterval(() => {
        secondsElapsed++;
        if (statusMessage) {
            statusMessage.innerHTML = `<span class="blinking-dot"></span>Recording... ${formatTime(secondsElapsed)}`;
        }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
  }

  function startCountdownAndRecord() {
    let countdown = 3;
    if (startRecordingButton) startRecordingButton.style.display = 'none';
    if (stopRecordingButton) stopRecordingButton.style.display = 'block';
    const countdownInterval = setInterval(() => {
        if (countdown > 0) {
            if (statusMessage) {
                statusMessage.style.fontSize = '1.5em';
                statusMessage.textContent = `Starting in ${countdown}`;
            }
            countdown--;
        } else {
            clearInterval(countdownInterval);
            if (statusMessage) statusMessage.style.fontSize = '';
            if (mediaRecorder?.state === 'inactive') {
                mediaRecorder.start();
                startTimer();
            }
        }
    }, 1000);
  }

  // --- Core Logic ---
  function stopWebcam() {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      webcamStream = null;
    }
    const existingVideo = document.getElementById(LIVE_VIDEO_ID);
    if (existingVideo) existingVideo.remove();
    showInitialChoice();
  }

  function resetMediaState() {
    stopTimer();
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    if (videoPreview) {
        videoPreview.removeAttribute('src');
    }
    capturedVideoFile = null;
    if (window.Wized?.data?.v) {
        Wized.data.v.wizedVideoFileObjectForUpload = null;
    }
    showInitialChoice();
  }

  async function startWebcam() {
    showWebcamView();
    try {
      if (!webcamFeedContainer) throw new Error("The '#webcam-feed' container was not found.");
      webcamFeedContainer.innerHTML = '';
      const videoEl = document.createElement('video');
      videoEl.id = LIVE_VIDEO_ID;
      videoEl.style.width = "100%";
      videoEl.style.height = "100%";
      videoEl.setAttribute('autoplay', '');
      videoEl.setAttribute('playsinline', '');
      webcamFeedContainer.appendChild(videoEl);
      const constraints = { video: { facingMode: 'environment' }, audio: true };
      webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = webcamStream;
      videoEl.muted = true;
      setupMediaRecorder();
    } catch (err) {
      console.error("Error accessing webcam:", err);
      if (statusMessage) statusMessage.textContent = `Error: ${err.message}`;
      stopWebcam();
    }
  }

  // 👇 THIS FUNCTION IS UPDATED
  function setupMediaRecorder() {
    if (!webcamStream) return;
    recordedChunks = [];

    // Define preferred formats, with mp4 first.
    const mimeTypes = [
      'video/mp4; codecs=avc1',
      'video/mp4',
      'video/webm; codecs=vp9',
      'video/webm'
    ];
    
    // Find the first supported mime type.
    const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

    if (!supportedMimeType) {
        console.error("No supported mime types found for MediaRecorder");
        if(statusMessage) statusMessage.textContent = "Your browser doesn't support video recording.";
        return;
    }

    console.log(`Using mime type: ${supportedMimeType}`);
    const options = { mimeType: supportedMimeType };

    try {
        mediaRecorder = new MediaRecorder(webcamStream, options);
    } catch (e) {
        console.error('Failed to create MediaRecorder:', e);
        return;
    }

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };

    // 👇 THIS FUNCTION IS UPDATED
    mediaRecorder.onstop = () => {
      stopTimer();
      
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
      }
      // Determine the file extension based on the mime type used.
      const mimeType = supportedMimeType || 'video/webm';
      const fileExtension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      
      const videoBlob = new Blob(recordedChunks, { type: mimeType });
      capturedVideoFile = new File([videoBlob], `review-video.${fileExtension}`, { type: mimeType });

      if (window.Wized?.data?.v) {
          Wized.data.v.wizedVideoFileObjectForUpload = capturedVideoFile;
          console.log("Wized file object updated:", Wized.data.v.wizedVideoFileObjectForUpload);
      }

      objectUrl = URL.createObjectURL(capturedVideoFile);
      if (videoPreview) {
          videoPreview.src = objectUrl;
          videoPreview.load();
          videoPreview.play().catch(e => console.error("Autoplay failed:", e));
      }
      showVideoPreviewView();
    };
  }

  // --- Event Listeners ---
  if (startVideoButton) {
    startVideoButton.addEventListener('click', startWebcam);
  }
  if (startRecordingButton) {
    startRecordingButton.addEventListener('click', startCountdownAndRecord);
  }
  if (stopRecordingButton) {
    stopRecordingButton.addEventListener('click', () => {
      if (mediaRecorder?.state === 'recording') {
        mediaRecorder.stop();
      }
    });
  }
  if (retakeVideoButton) {
    retakeVideoButton.addEventListener('click', resetMediaState);
  }
  if (cancelWebcamButton) {
    cancelWebcamButton.addEventListener('click', () => {
        if (webcamStream) {
          webcamStream.getTracks().forEach(track => track.stop());
          webcamStream = null;
        }
        showInitialChoice();
    });
  }

  // --- Initialize ---
  showInitialChoice();
});
