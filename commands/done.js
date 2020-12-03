const {
  removeNameInQueue,
  getAccountNameFromCommandRequest,
} = require("../common/utilities");
const config = require("../common/getConfig")();

module.exports = {
  name: "done",
  description: "Use when finished using title buff",
  syntax: `${config.PREFIX1}done or ${config.PREFIX1}done [username]`,
  po: true,
  execute(message) {
    // Check if command is used on correct channel
    if (!checkChannelIfBuffChannel(message)) return;

    removeNameInQueue(message, getAccountNameFromCommandRequest(message));
  },
};
