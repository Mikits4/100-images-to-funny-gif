window.onload = () => {
  const { createFFmpeg, fetchFile } = window.FFmpeg;
  let ffmpeg = null;
  
  // DOM Elements
  const inputEl = document.getElementById('input');
  const button = document.getElementById('make-video');
  const status = document.getElementById('status');
  const loading = document.getElementById('loading');
  const downloadLink = document.getElementById('download');
  const preview = document.getElementById('preview');

  // Initialize FFmpeg
  const initializeFFmpeg = async () => {
    ffmpeg = createFFmpeg({
      log: true,
      corePath: 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/ffmpeg-core.js',
      progress: ({ ratio }) => {
        const percent = (ratio * 100).toFixed(2);
        status.textContent = `Processing: ${percent}%`;
      }
    });
    
    await ffmpeg.load();
  };

  // Handle file input changes
  inputEl.addEventListener('change', () => {
    button.disabled = inputEl.files.length === 0;
    status.textContent = inputEl.files.length > 0 
      ? `${inputEl.files.length} images selected`
      : 'Select images to begin';
  });

  // Create video handler
  button.addEventListener('click', async () => {
    if (!ffmpeg) await initializeFFmpeg();
    
    const files = inputEl.files;
    if (files.length === 0) {
      alert('Please select at least one image');
      return;
    }

    try {
      // Show loading state
      loading.style.display = 'flex';
      button.disabled = true;
      downloadLink.style.display = 'none';
      preview.style.display = 'none';

      // Sort files and prepare names
      const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));
      const padLength = sortedFiles.length.toString().length;
      
      // Write files to FFmpeg FS
      status.textContent = 'Preparing images...';
      for (let i = 0; i < sortedFiles.length; i++) {
        const filename = `frame${String(i+1).padStart(padLength, '0')}.jpg`;
        ffmpeg.FS('writeFile', filename, await fetchFile(sortedFiles[i]));
      }

      // Run FFmpeg command
      status.textContent = 'Encoding video...';
      await ffmpeg.run(
        '-framerate', '30',
        '-i', `frame%0${padLength}d.jpg`,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-r', '30',
        'output.mp4'
      );

      // Get and display result
      const videoData = ffmpeg.FS('readFile', 'output.mp4');
      const videoBlob = new Blob([videoData.buffer], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);

      downloadLink.href = videoUrl;
      downloadLink.style.display = 'inline-block';
      
      preview.src = videoUrl;
      preview.style.display = 'block';
      preview.load();

      status.textContent = `Video created! (${Math.round(videoBlob.size/1024)}KB)`;
    } catch (error) {
      console.error(error);
      status.textContent = `Error: ${error.message}`;
      alert('Video creation failed. Please check the console for details.');
    } finally {
      loading.style.display = 'none';
      button.disabled = false;
    }
  });
};