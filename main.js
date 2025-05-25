window.onload = () => {
  const { createFFmpeg, fetchFile } = FFmpeg;
  const ffmpeg = createFFmpeg({ log: true, progress: ({ ratio }) => {
    const percent = (ratio * 100).toFixed(2);
    document.getElementById('status').textContent = `Processing video: ${percent}%`;
  }});

  const inputEl = document.getElementById('input');
  const button = document.getElementById('make-video');
  const status = document.getElementById('status');
  const loading = document.getElementById('loading');
  const downloadLink = document.getElementById('download');
  const preview = document.getElementById('preview');

  const showLoading = () => loading.style.display = 'flex';
  const hideLoading = () => loading.style.display = 'none';

  button.onclick = async () => {
    const files = inputEl.files;
    if (files.length !== 100) {
      alert("Please upload exactly 100 images.");
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
      // Sort files by name to ensure correct frame order
      const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));

      for (let i = 0; i < sortedFiles.length; i++) {
        const filename = `frame${String(i).padStart(3, '0')}.jpg`;
        ffmpeg.FS('writeFile', filename, await fetchFile(sortedFiles[i]));
      }

      status.textContent = "Generating video...";
      await ffmpeg.run(
        '-framerate', '1',
        '-i', 'frame%03d.jpg',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        'out.mp4'
      );

      const data = ffmpeg.FS('readFile', 'out.mp4');
      const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
      const videoURL = URL.createObjectURL(videoBlob);

      downloadLink.href = videoURL;
      downloadLink.style.display = 'inline-block';

      preview.src = videoURL;
      preview.style.display = 'block';
      preview.load();

      status.textContent = "Done!";
    } catch (e) {
      console.error(e);
      status.textContent = "An error occurred: " + e.message;
    } finally {
      hideLoading();
    }
  };
};
