window.onload = () => {
  const { createFFmpeg, fetchFile } = FFmpeg;
  const ffmpeg = createFFmpeg({ 
    log: true, 
    progress: ({ ratio }) => {
      const percent = (ratio * 100).toFixed(2);
      document.getElementById('status').textContent = `Processing video: ${percent}%`;
    }
  });

  // ... element references remain the same ...

  button.onclick = async () => {
    const files = inputEl.files;
    if (files.length === 0) { // Fixed: Check for any files instead of 100
      alert("Please upload at least one image.");
      return;
    }

    showLoading();
    status.textContent = "Loading FFmpeg core...";
    downloadLink.style.display = 'none';
    preview.style.display = 'none';

    try {
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      }

      status.textContent = "Writing images to memory...";
      const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));

      // Write all files with padding based on total count
      const padLength = sortedFiles.length.toString().length;
      for (let i = 0; i < sortedFiles.length; i++) {
        const filename = `frame${String(i).padStart(padLength, '0')}.jpg`;
        ffmpeg.FS('writeFile', filename, await fetchFile(sortedFiles[i]));
      }

      status.textContent = "Generating video...";
      await ffmpeg.run(
        '-framerate', '30', // Increased framerate for smoother playback
        '-i', `frame%0${padLength}d.jpg`, // Dynamic frame pattern
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions
        '-r', '30', // Output framerate
        'out.mp4'
      );

      // ... rest of video handling remains the same ...
    } catch (e) {
      console.error(e);
      status.textContent = "An error occurred: " + (e.message || 'Unknown error');
    } finally {
      hideLoading();
    }
  };
};