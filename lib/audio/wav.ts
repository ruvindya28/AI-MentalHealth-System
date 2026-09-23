/**
 * Wraps raw PCM samples or cleans existing WAV audio from Gemini TTS into a
 * pristine, standard 44-byte WAV/RIFF container format.
 *
 * Prevents noise/clicks at the end of speech by:
 * 1. Stripping out Google's trailing C2PA provenance metadata chunks so they
 *    are never decoded as audio noise.
 * 2. Applying a 15ms cosine micro fade-out at the audio tail so the speaker
 *    cone returns smoothly to neutral without a mechanical pop or click.
 */
export function pcmToWav(
    inputBuf: Buffer,
    fallbackSampleRate = 24000,
    defaultChannels = 1,
    defaultBitsPerSample = 16
): Buffer {
    let pcmBuf: Buffer;
    let sampleRate = fallbackSampleRate;
    let numChannels = defaultChannels;
    let bitsPerSample = defaultBitsPerSample;

    // Check if input is already a RIFF/WAVE container
    if (
        inputBuf.length >= 12 &&
        inputBuf.slice(0, 4).toString("ascii") === "RIFF" &&
        inputBuf.slice(8, 12).toString("ascii") === "WAVE"
    ) {
        let offset = 12;
        let dataOffset = -1;
        let dataSize = -1;

        while (offset + 8 <= inputBuf.length) {
            const chunkId = inputBuf.slice(offset, offset + 4).toString("ascii");
            const chunkSize = inputBuf.readUInt32LE(offset + 4);

            if (chunkId === "fmt " && chunkSize >= 16) {
                numChannels = inputBuf.readUInt16LE(offset + 10);
                sampleRate = inputBuf.readUInt32LE(offset + 12);
                bitsPerSample = inputBuf.readUInt16LE(offset + 22);
            } else if (chunkId === "data") {
                dataOffset = offset + 8;
                dataSize = chunkSize;
                break;
            }

            offset += 8 + chunkSize;
        }

        if (dataOffset !== -1 && dataSize > 0) {
            const actualDataEnd = Math.min(dataOffset + dataSize, inputBuf.length);
            pcmBuf = Buffer.from(inputBuf.slice(dataOffset, actualDataEnd));
        } else {
            pcmBuf = Buffer.from(inputBuf.slice(44));
        }
    } else {
        pcmBuf = Buffer.from(inputBuf);
    }

    // Ensure 16-bit word alignment
    if (pcmBuf.length % 2 !== 0) {
        pcmBuf = pcmBuf.slice(0, pcmBuf.length - 1);
    }

    // Apply a gentle 15ms cosine fade-out at the tail to eliminate speaker pops/clicks
    const fadeSamples = Math.min(Math.floor(sampleRate * 0.015), Math.floor(pcmBuf.length / 2));
    const totalSamples = Math.floor(pcmBuf.length / 2);
    const startFadeSample = totalSamples - fadeSamples;

    for (let i = 0; i < fadeSamples; i++) {
        const sampleIndex = startFadeSample + i;
        const byteOffset = sampleIndex * 2;
        const factor = 0.5 * (1 + Math.cos((Math.PI * (i + 1)) / fadeSamples));
        const originalVal = pcmBuf.readInt16LE(byteOffset);
        pcmBuf.writeInt16LE(Math.round(originalVal * factor), byteOffset);
    }

    // Build a clean, standard 44-byte WAV header
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const header = Buffer.alloc(44);

    header.write("RIFF", 0, "ascii");
    header.writeUInt32LE(36 + pcmBuf.length, 4);
    header.write("WAVE", 8, "ascii");
    header.write("fmt ", 12, "ascii");
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM format
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write("data", 36, "ascii");
    header.writeUInt32LE(pcmBuf.length, 40);

    return Buffer.concat([header, pcmBuf]);
}
