// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: book;
// This script shows a random Scriptable API in a widget. The script is meant to be used with a widget configured on the Home Screen.
// You can run the script in the app to preview the widget or you can go to the Home Screen, add a new Scriptable widget and configure the widget to run this script.
// You can also try creating a shortcut that runs this script. Running the shortcut will show widget.
let url = args.widgetParameter;
let size = config.widgetFamily;
if (!config.runsInWidget) {
  url = "http://mpmd";
  size = 'small';
}
let mpmd = await mpmdValues(url);
let widget = await createWidget(mpmd, url, size);
if (config.runsInWidget) {
  // The script runs inside a widget, so we pass our instance of ListWidget to be shown inside the widget on the Home Screen.
  Script.setWidget(widget);
} else {
  // The script runs inside the app, so we preview the widget.
  switch (size) {
    case 'small':
      widget.presentSmall();
      break;
    case 'medium':
      widget.presentMedium();
      break;
  }
}
// Calling Script.complete() signals to Scriptable that the script have finished running.
// This can speed up the execution, in particular when running the script from Shortcuts or using Siri.
Script.complete();

async function createWidget(mpmd, url, size) {
  switch (size) {
    case 'medium':
      return await createSmallWidget(mpmd, url);
    case 'small':
      return await createSmallWidget(mpmd, url);
  }
}

async function createWidgetHeader(evcc, url, compact) {
  let widget = new ListWidget();
  widget.url = url;
  // Add background gradient
  let gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color("141414"),
    new Color("13233F")
  ];
  widget.backgroundGradient = gradient;
  // Show app icon and title
  let titleStack = widget.addStack();
  let title = "MPMD Status";
  let titleElement = titleStack.addText(title);
  titleElement.textColor = Color.white();
  titleElement.textOpacity = 0.7;
  titleElement.font = Font.mediumSystemFont(13);
  titleStack.addSpacer();
  let time = titleStack.addDate(new Date());
  time.applyTimeStyle();
  time.textColor = Color.white();
  time.font = Font.mediumSystemFont(13);
  widget.addSpacer(12);

  return widget;
}

async function createSmallWidget(mpmd, url) {
  let widget = await createWidgetHeader(mpmd, url, true);

  let statusStack = widget.addStack();
  let statusText = statusStack.addText(mpmd.status);
  statusText.textColor = Color.white();
  statusText.font = Font.mediumSystemFont(30);

  widget.addSpacer(2);

  let progressStack = widget.addStack();
  let progressText = progressStack.addText(mpmd.progress + "%");
  progressText.textColor = Color.white();
  progressText.font = Font.mediumSystemFont(30);

  return widget;
}

async function mpmdValues(url) {
  try {
    let api = await loadFromApi(url);
    let status = api.charAt(api.length - 1);
    return {
      nozzleTemp: api.match(/\d+/g)[0],
      bedTemp: api.match(/\d+/g)[0],
      status: status == 'P' ? 'Printing' : 'Idle',
      progress: status == 'P' ? api.match(/\d+/g)[4] : '0'
    };
  } catch (e) {
    return {
      nozzleTemp: '0',
      bedTemp: '0',
      status: 'Offline',
      progress: '0'
    };
  }
}

async function loadFromApi(url) {
  let fullUrl = url + "/inquiry";
  let req = new Request(fullUrl);
  return await req.loadString();
}

