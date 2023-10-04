// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: book;
// This script shows a random Scriptable API in a widget. The script is meant to be used with a widget configured on the Home Screen.
// You can run the script in the app to preview the widget or you can go to the Home Screen, add a new Scriptable widget and configure the widget to run this script.
// You can also try creating a shortcut that runs this script. Running the shortcut will show widget.
let evcc = await evccValues();
let widget = await createWidget(evcc);
if (config.runsInWidget) {

  // The script runs inside a widget, so we pass our instance of ListWidget to be shown inside the widget on the Home Screen.
  Script.setWidget(widget);
} else {

  // The script runs inside the app, so we preview the widget.
  widget.presentMedium();
}
// Calling Script.complete() signals to Scriptable that the script have finished running.
// This can speed up the execution, in particular when running the script from Shortcuts or using Siri.
Script.complete();

async function createWidget(evcc) {
  let appIcon = await loadAppIcon();
  let widget = new ListWidget();
  widget.url = args.widgetParameter;
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
  let appIconElement = titleStack.
    addImage
    (appIcon);
  appIconElement.imageSize = new Size(15, 15);
  appIconElement.cornerRadius = 4;
  titleStack.addSpacer(4);
  let titleElement = titleStack.addText(evcc.siteTitle + " | evcc");
  titleElement.textColor = Color.white();
  titleElement.textOpacity = 0.7;
  titleElement.font = Font.mediumSystemFont(13);
  titleStack.addSpacer();
  let time = titleStack.addDate(new Date());
  time.applyTimeStyle();
  time.textColor = Color.white();
  time.font = Font.mediumSystemFont(13);
  widget.addSpacer(12);

  // Show house values PV and grid
  let pvStack = widget.addStack();
  let houseIcon = SFSymbol.named("house.fill");
  let house = pvStack.addImage(houseIcon.image);
  house.imageSize = new Size(24, 24);
  pvStack.addSpacer(2);
  pvStack.addText(formatWatts(evcc.homePower) + "•").textColor = Color.white();
  let sunIcon = SFSymbol.named("sun.max");
  let sun = pvStack.addImage(sunIcon.image);
  sun.imageSize = new Size(24, 24);
  pvStack.addSpacer(2);
  pvStack.addText(formatWatts(Math.abs(evcc.pvPower)) + "•").textColor = Color.white();
  let powerIcon = SFSymbol.named("bolt");
  let power = pvStack.addImage(powerIcon.image);
  power.imageSize = new Size(24, 24);
  pvStack.addSpacer(2);
  let gridPowerText = pvStack.addText(formatWatts(Math.abs(evcc.gridPower)));
  colorText(gridPowerText, ~~evcc.gridPower);

  // Show battery values SoC and power
  let batteryStack = widget.addStack();
  let batteryIcon = SFSymbol.named(getBatteryIconName(evcc.batterySoc));
  let battery = batteryStack.addImage(batteryIcon.image);
  battery.imageSize = new Size(24, 24);
  batteryStack.addSpacer(2);
  batteryStack.addText(evcc.batterySoc.toString() + "%•").textColor = Color.white();
  let battPower = batteryStack.addImage(powerIcon.image);
  battPower.imageSize = new Size(24, 24);
  batteryStack.addSpacer(2);
  let batteryPowerText = batteryStack.addText(formatWatts(Math.abs(evcc.batteryPower)));
  colorText(batteryPowerText, ~~evcc.batteryPower);

  // Show Car title
  let carStack = widget.addStack();
  let carIcon = SFSymbol.named("car.fill");
  let car = carStack.addImage(carIcon.image);
  car.imageSize = new Size(24, 24);
  carStack.addSpacer(2);
  carStack.addText(evcc.vehicleTitle).textColor = Color.white();

  // Show car values Soc and charge power
  let carChargeStack = widget.addStack();
  carChargeStack.addSpacer(12);
  let carBatteryIcon = SFSymbol.named(getBatteryIconName(evcc.vehicleSoc));
  let carBattery = carChargeStack.addImage(carBatteryIcon.image);
  carBattery.imageSize = new Size(24, 24);
  carChargeStack.addSpacer(2);
  carChargeStack.addText(evcc.vehicleSoc.toString() + "%•").textColor = Color.white();
  let carPower = carChargeStack.addImage(powerIcon.image);
  carPower.imageSize = new Size(24, 24);
  carChargeStack.addSpacer(2);
  carChargeStack.addText(formatWatts(evcc.chargePower) + "•").textColor = Color.white();
  let chargeTimeIcon = SFSymbol.named("timer");
  let chargeTime = carChargeStack.addImage(chargeTimeIcon.image);
  chargeTime.imageSize = new Size(24, 24);
  carChargeStack.addSpacer(2);
  carChargeStack.addText(formatDuration(evcc.chargeRemainingDuration)).textColor = Color.white();

  return widget;
}

function getBatteryIconName(batterySoc) {
  let batteryIconName = "battery.0percent";
  if (batterySoc > 97) {
    batteryIconName = "battery.100percent";
  } else if (batterySoc >= 75) {
    batteryIconName = "battery.75percent";
  } else if (batterySoc >= 50) {
    batteryIconName = "battery.50percent";
  } else if (batterySoc >= 25) {
    batteryIconName = "battery.0percent";
  }
  return batteryIconName;
}

function zeroPad(num, places) {
  return String(num).padStart(places, '0');
}

function formatDuration(totalSecs) {
  let mins = ~~((totalSecs / 60)) % 60;
  let hours = ~~(totalSecs / 3600);
  return zeroPad(hours, 2) + ":" + zeroPad(mins, 2);
}

function colorText(text, value) {
  if (value > 0) {
    text.textColor = Color.red();
  } else if (value < 0) {
    text.textColor = Color.green();
  } else {
    text.textColor = Color.white();
  }
}

function formatWatts(watts) {
  if (watts > 999 || watts < -999) {
    return (~~(watts / 100)) / 10 + "kW";
  } else {
    return (~~watts).toString() + "W";
  }
}

async function evccValues() {
  let api = await loadFromApi();
  let evcc = api["result"];
  let loadpoint = evcc["loadpoints"][0];
  return {
    batterySoc: evcc["batterySoc"],
    batteryPower: evcc["batteryPower"],
    pvPower: evcc["pvPower"],
    gridPower: evcc["gridPower"],
    homePower: evcc["homePower"],
    chargePower: loadpoint["chargePower"],
    vehicleTitle: loadpoint["vehicleTitle"],
    vehicleSoc: loadpoint["vehicleSoc"],
    siteTitle: evcc["siteTitle"],
    homePower: evcc["homePower"],
    chargeRemainingDuration: ~~(loadpoint["chargeRemainingDuration"] / 1000000000)
  };
}

async function loadFromApi() {
  let url = args.widgetParameter + "/api/state";
  let req = new Request(url);
  return await req.loadJSON();
}

async function loadAppIcon() {
  let url = args.widgetParameter + "/meta/favicon.ico";
  let req = new Request(url);
  return req.loadImage();
}
