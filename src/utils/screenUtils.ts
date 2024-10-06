export const toggleFullScreen = () => {
  const elem = document.documentElement;

  // Check if the document is already in fullscreen mode
  if (!document.fullscreenElement) {
    // Enter fullscreen
    elem.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
    });
  } else {
    // Exit fullscreen
    document.exitFullscreen().catch((err) => {
      console.error(`Error attempting to exit fullscreen mode: ${err.message} (${err.name})`);
    });
  }
};
