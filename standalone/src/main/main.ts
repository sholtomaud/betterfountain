/**
 * The entry-point of the app, it is a node.js process
 * which doesn't actually render anything directly, it 
 * just handles all the interactions with the OS (such as file
 * operations, window mangement, etc...)
 * 
 * Communication with the renderer process occurs through 'ipcMain'
 */


import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, shell } from 'electron';
import { electron } from 'process';
import * as fs from 'fs';
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    frame:false,
    webPreferences:{
      nodeIntegration: true
    }
  });



  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.on('ready-to-show', ()=>{
    mainWindow.webContents.send('window', mainWindow.isMaximized() ? 'maximize' : 'unmaximize')
  });

  
  // Upper Limit is working of 500 % 

  
  mainWindow.on('maximize', ()=>{
    mainWindow.webContents.send('window','maximize');
  })
  mainWindow.on('unmaximize', ()=>{
    mainWindow.webContents.send('window', 'unmaximize');
  })
  mainWindow.on('blur', ()=>{
    mainWindow.webContents.send('window','blur');
  })
  mainWindow.on('focus', ()=>{
    mainWindow.webContents.send('window','focus');
  })

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

ipcMain.on('window', (event, op) => {
  if(op == 'close'){
    BrowserWindow.fromWebContents(event.sender).close();
  }
  else if(op == 'minimize'){
    BrowserWindow.fromWebContents(event.sender).minimize();
  }
  else if(op == 'maximize'){
    const win = BrowserWindow.fromWebContents(event.sender);
    if(win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
  else if(op == 'reload'){
    const win = BrowserWindow.fromWebContents(event.sender);
    win.reload();
  }
  else if(op == 'devtools'){
    const win = BrowserWindow.fromWebContents(event.sender);
    event.sender.openDevTools();
  }
});

ipcMain.on('file', async (event, op)=>{
  if(op == "open"){
    let window = BrowserWindow.fromWebContents(event.sender);
    let d = await dialog.showOpenDialog(window, {properties:['openFile'], buttonLabel:"Open screenplay", filters:[{name:'Fountain', extensions:['fountain','spmd']}]});
    if(!d.canceled){
      let filename = d.filePaths[0].split('\\').pop().split('/').pop();
      let contents = fs.readFileSync(d.filePaths[0]).toString();
      window.webContents.send('file', 'open', {contents: contents, name: filename});
    }
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// sets the menu
Menu.setApplicationMenu(null);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
