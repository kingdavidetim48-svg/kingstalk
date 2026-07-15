"use client";

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  // Mix down all channels to mono
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    channelData.push(audioBuffer.getChannelData(ch));
  }
  const length = audioBuffer.length;
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let ch = 0; ch < channelData.length; ch++) {
      sum += channelData[ch][i];
    }
    data[i] = sum / channelData.length;
  }

  const dataLength = data.length * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export async function extractAudioFromVideo(file: File): Promise<File> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  const url = URL.createObjectURL(file);
  video.src = url;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => {
      if (video.duration > 300) {
        reject(new Error("Video exceeds the 5-minute limit"));
        return;
      }
      resolve();
    };
    video.onerror = () => reject(new Error("Failed to load video"));
    setTimeout(() => reject(new Error("Video load timeout")), 30000);
  });

  async function fallbackDecode(): Promise<File> {
    const buf = await file.arrayBuffer();
    const ctx = new AudioContext();
    try {
      const decoded = await ctx.decodeAudioData(buf);
      const blob = audioBufferToWavBlob(decoded);
      const name = file.name.replace(/\.[^.]+$/, ".wav");
      return new File([blob], name, { type: "audio/wav" });
    } finally {
      await ctx.close();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (video as any).captureStream !== "function") {
    URL.revokeObjectURL(url);
    return fallbackDecode();
  }

  try {
    await video.play();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = (video as any).captureStream();
    const audioTrack = stream.getAudioTracks()[0];

    if (!audioTrack) {
      video.pause();
      URL.revokeObjectURL(url);
      throw new Error("No audio track found");
    }

    const audioStream = new MediaStream([audioTrack]);
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(audioStream, { mimeType });

    const result = await new Promise<File>((resolve, reject) => {
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const name = file.name.replace(/\.[^.]+$/, ".webm");
        resolve(new File([blob], name, { type: "audio/webm" }));
      };
      recorder.onerror = () => reject(new Error("Audio recording failed"));
      recorder.start(100);
      video.onended = () => {
        if (recorder.state === "recording") recorder.stop();
      };
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, video.duration * 1000 + 500);
    });

    video.pause();
    URL.revokeObjectURL(url);
    return result;
  } catch {
    video.pause();
    URL.revokeObjectURL(url);
    return fallbackDecode();
  }
}

export async function cropAudioBuffer(
  file: File,
  startTime: number,
  endTime: number,
): Promise<File> {
  const buf = await file.arrayBuffer();
  const ctx = new AudioContext();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(buf);
  } finally {
    await ctx.close();
  }

  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.min(Math.floor(endTime * sampleRate), audioBuffer.length);
  const length = endSample - startSample;

  if (length <= 0) throw new Error("Invalid crop range");

  const offlineCtx = new OfflineAudioContext(channels, length, sampleRate);
  const source = offlineCtx.createBufferSource();
  const croppedBuffer = offlineCtx.createBuffer(channels, length, sampleRate);

  for (let ch = 0; ch < channels; ch++) {
    const data = audioBuffer.getChannelData(ch);
    const chunk = new Float32Array(data.slice(startSample, endSample));
    croppedBuffer.copyToChannel(chunk, ch);
  }

  source.buffer = croppedBuffer;
  source.connect(offlineCtx.destination);
  source.start();
  const rendered = await offlineCtx.startRendering();

  const blob = audioBufferToWavBlob(rendered);
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}-trimmed.wav`, { type: "audio/wav" });
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
