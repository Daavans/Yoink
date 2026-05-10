import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('yoink', {
  metadata: {
    fetch: (url: string) => ipcRenderer.invoke('metadata:fetch', url),
  },

  download: {
    start: (opts: unknown) => ipcRenderer.invoke('download:start', opts),
    cancel: () => ipcRenderer.invoke('download:cancel'),
    onProgress: (cb: (data: unknown) => void) => {
      const listener = (_: unknown, data: unknown) => cb(data);
      ipcRenderer.on('download:progress', listener);
      return () => ipcRenderer.removeListener('download:progress', listener);
    },
    onDone: (cb: (data: unknown) => void) => {
      const listener = (_: unknown, data: unknown) => cb(data);
      ipcRenderer.on('download:done', listener);
      return () => ipcRenderer.removeListener('download:done', listener);
    },
    onError: (cb: (msg: string) => void) => {
      const listener = (_: unknown, msg: string) => cb(msg);
      ipcRenderer.on('download:error', listener);
      return () => ipcRenderer.removeListener('download:error', listener);
    },
  },

  history: {
    get: () => ipcRenderer.invoke('history:get'),
    add: (entry: unknown) => ipcRenderer.invoke('history:add', entry),
    clear: () => ipcRenderer.invoke('history:clear'),
  },

  storage: {
    get: () => ipcRenderer.invoke('storage:get'),
  },

  file: {
    reveal: (path: string) => ipcRenderer.invoke('file:reveal', path),
    chooseDir: () => ipcRenderer.invoke('file:chooseDir'),
    pickInput: () => ipcRenderer.invoke('file:pickInput'),
    readBytes: (filePath: string) => ipcRenderer.invoke('file:readBytes', filePath),
  },

  convert: {
    probe: (filePath: string) => ipcRenderer.invoke('convert:probe', filePath),
    start: (opts: unknown) => ipcRenderer.invoke('convert:start', opts),
    cancel: () => ipcRenderer.invoke('convert:cancel'),
    onProgress: (cb: (data: unknown) => void) => {
      const listener = (_: unknown, data: unknown) => cb(data);
      ipcRenderer.on('convert:progress', listener);
      return () => ipcRenderer.removeListener('convert:progress', listener);
    },
    onDone: (cb: (data: unknown) => void) => {
      const listener = (_: unknown, data: unknown) => cb(data);
      ipcRenderer.on('convert:done', listener);
      return () => ipcRenderer.removeListener('convert:done', listener);
    },
    onError: (cb: (msg: string) => void) => {
      const listener = (_: unknown, msg: string) => cb(msg);
      ipcRenderer.on('convert:error', listener);
      return () => ipcRenderer.removeListener('convert:error', listener);
    },
    saveBuffer: (data: ArrayBuffer, outputPath: string) =>
      ipcRenderer.invoke('convert:saveBuffer', data, outputPath),
  },

  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  system: {
    platform: () => ipcRenderer.invoke('system:platform'),
  },

  clipboard: {
    read: () => ipcRenderer.invoke('clipboard:read'),
  },
});
