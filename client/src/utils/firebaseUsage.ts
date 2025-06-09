export let readCount = 0;
export let writeCount = 0;
export let deleteCount = 0;
export let bytesWritten = 0;

/** Increment the read counter by given amount (default 1) */
export function incrRead(count: number = 1) {
  readCount += count;
}

/** Increment the write counter by given amount (default 1) */
export function incrWrite(count: number = 1) {
  writeCount += count;
}

/** Increment delete operation count */
export function incrDelete(count: number = 1) {
  deleteCount += count;
}

/** Increment total bytes written count */
export function incrBytesWritten(bytes: number) {
  bytesWritten += bytes;
}

/** Reset both read and write counters to zero */
export function resetCounts() {
  readCount = 0;
  writeCount = 0;
  deleteCount = 0;
  bytesWritten = 0;
}

/** Get the current read count */
export function getReadCount(): number {
  return readCount;
}

/** Get the current write count */
export function getWriteCount(): number {
  return writeCount;
}

/** Get current delete count */
export function getDeleteCount(): number {
  return deleteCount;
}

/** Get current total bytes written */
export function getBytesWritten(): number {
  return bytesWritten;
} 