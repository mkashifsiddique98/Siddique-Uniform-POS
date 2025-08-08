const { contextBridge } = require('electron');

// You can expose safe APIs here
contextBridge.exposeInMainWorld('api', {
  ping: () => 'pong'
});
