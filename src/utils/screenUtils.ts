export const toggleFullScreen = () => {
  const elem = document.documentElement;

  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
      });
    } else if ((elem as any).mozRequestFullScreen) { // Firefox
      (elem as any).mozRequestFullScreen().catch(err => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
      });
    } else if ((elem as any).webkitRequestFullscreen) { // Chrome, Safari, Opera
      (elem as any).webkitRequestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
      });
    } else if ((elem as any).msRequestFullscreen) { // IE/Edge
      (elem as any).msRequestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
      });
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.error(`Error attempting to exit fullscreen mode: ${err.message} (${err.name})`);
      });
    } else if ((document as any).mozCancelFullScreen) { // Firefox
      (document as any).mozCancelFullScreen().catch((err) => {
        console.error(`Error attempting to exit fullscreen mode: ${err.message} (${err.name})`);
      });
    } else if ((document as any).webkitExitFullscreen) { // Chrome, Safari, Opera
      (document as any).webkitExitFullscreen().catch(err => {
        console.error(`Error attempting to exit fullscreen mode: ${err.message} (${err.name})`);
      });
    } else if ((document as any).msExitFullscreen) { // IE/Edge
      (document as any).msExitFullscreen().catch(err => {
        console.error(`Error attempting to exit fullscreen mode: ${err.message} (${err.name})`);
      });
    }
  }
};
