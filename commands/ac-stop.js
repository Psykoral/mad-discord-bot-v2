const { readJson, writeJson, hasPoAccess } = require("../common/utilities");
const { msgPoHasNoAccess } = require("../common/messages");
const config = require("../common/getConfig")();

module.exports = {
  name: "ac-stop",
  description: "AC Lord Commander Buff MODE",
  syntax: `${config.PREFIX1}AC-stop`,
  po: true,
  execute(message) {
    // Check for the channel access
    if (message.channel.name != config.BUFF_CHANNEL) {
      return false;
    }

    // Check if user has proper role for access
    if (!hasPoAccess(message)) {
      msgPoHasNoAccess(message);
      return false;
    }

    readJson("/data/buff-mode.json")
      .then((data) => {
        /**
         * If buff mode condition is true, make it false
         */
        if (data["buff-mode"]) {
          // Update buff-mode value to false
          data["buff-mode"] = false;
          writeJson("/data/buff-mode.json", data)
            .then((data) => {
              if (data) {
                console.log(data);
                message.channel.send(
                  `Alliance Conquest Buff Mode OFF! Regular titles are enabled! Get them!`
                );
              }
            })
            .catch((err) => {
              throw new Error(err);
            });
        }
      })
      .catch((error) => console.log(error));
  },
};
