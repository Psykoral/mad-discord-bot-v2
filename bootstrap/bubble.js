const config = require("../common/getConfig")();
const {
  initGoogleSpreadsheetConnection,
  getSheetCellVal,
} = require("../common/utilities");
const { getSettings } = require("../config/settings");
const settings = getSettings();

/**
 * Get date time now
 */
const dateTimeNow = (dateTime = null) => {
  const d = dateTime ? dateTime : new Date();
  const date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const time = `${d.getHours()}:${d.getMinutes()}`;
  return date + " " + time;
};

/**
 * Get duration between two times
 * with 3 hours interval
 */
const getDurationBetweenTwoDates = (dateTime) => {
  const dateStart = new Date(dateTime);
  const dateEnd = new Date(dateTime);

  // Reduce start date of 3 hrs
  dateStart.setHours(dateStart.getHours() - 3);

  return [dateTimeNow(dateStart), dateTimeNow(dateEnd)];
};

/**
 * Check time store record
 * for each records time expiration
 * and if time is near expiration
 * (less than 3 hours),
 * send message notification
 * in specified text channel
 *
 * @param o | object
 * - castle: castle name
 * - duration: duration from spreadsheet cell
 * - isRenewed: boolean condition from spreadsheet cell
 * - channel: specified channel for sending message as notif
 * - sheet: established google spreadsheet
 */
const checkTimeStoreForExpiration = async (o) => {
  /**
   * Constants for boolean values
   * identified as strings
   */
  const t = {
    FALSE: false,
    TRUE: true,
  };
  if (!t[o.isRenewed]) {
    const durationBetween = getDurationBetweenTwoDates(o.duration);
    if (
      new Date(dateTimeNow()) >= new Date(durationBetween[0]) &&
      new Date(dateTimeNow()) <= new Date(durationBetween[1])
    ) {
      o.sheet.getCellByA1(o.isRenewedCell).value = "TRUE";
      await o.sheet.saveUpdatedCells();
      o.channel.send(
        `@here ${o.castle} bubble is going to expire in less than 3 hours. Please apply new bubble asap!`
      );
    }
  }
};

const bootstrapBubble = async (client) => {
  console.log("Bubble bot is running...");
  const bubbleDetail = settings.BUBBLE;
  /**
   * Find specified text channel
   * based on specified guild
   */
  const managementChannel = client.channels.cache.find(
    (ch) => ch.name == bubbleDetail.channel
  );

  const sheet = await initGoogleSpreadsheetConnection(
    config.TIME_STORE_SPREADSHEET_ID,
    config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    config.GOOGLE_PRIVATE_KEY
  );

  await sheet.loadCells(bubbleDetail.cellsCovered);

  for (castleRecord of settings.BUBBLE.TIME_STORE) {
    const c = castleRecord;
    const cells = c.durationAndRenewedCell;
    checkTimeStoreForExpiration({
      castle: c.name,
      duration: getSheetCellVal(sheet, cells[0]),
      isRenewed: getSheetCellVal(sheet, cells[1]),
      isRenewedCell: cells[1],
      channel: managementChannel,
      sheet: sheet,
    });
  }
};

module.exports = {
  bootstrapBubble,
};
