type ImageErrorEvent = {
  nativeEvent?: {
    error?: string;
  };
};

export function logImageError(
  label: string,
  uri: string | null | undefined,
  event: ImageErrorEvent,
): void {
  console.warn(
    `[image-load-failed] ${label}`,
    JSON.stringify({
      uri,
      error: event.nativeEvent?.error ?? 'Unknown image error',
    }),
  );
}
