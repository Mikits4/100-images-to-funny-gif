const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

document.getElementById('make-video').onclick = async () => {
  const files = document.getElementById('input').files;
  if (files.length !== 100) {
    alert("Please upload exactly 100 images.");
    return;
  }

  document.getElementById('status').textContent = "Loading FFmpeg...";
  await ffmpeg.load();

  const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));

  for (let i = 0; i < sortedFiles.length; i++) {
    const filename = `frame${String(i).padStart(3, '0')}.jpg`;
    ffmpeg.FS('writeFile', filename, await fetchFile(sortedFiles[i]));
  }

  document.getElementById('status').textContent = "Generating video...";

  await ffmpeg.run(
    '-framerate', '1', // 1 frame per second
    '-i', 'frame%03d.jpg',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    'out.mp4'
  );

  const data = ffmpeg.FS('readFile', 'out.mp4');
const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
const videoURL = URL.createObjectURL(videoBlob);

// Set up download link
const downloadLink = document.getElementById('download');
downloadLink.href = videoURL;
downloadLink.download = 'video.mp4';
downloadLink.textContent = 'Download MP4';
downloadLink.style.display = 'block';

// Display video preview
const preview = document.getElementById('preview');
preview.src = videoURL;
preview.style.display = 'block';
preview.load();

document.getElementById('status').textContent = "Done!";
};
