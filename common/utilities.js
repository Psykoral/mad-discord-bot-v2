const fs = require("fs");
const path = require("path");
const embed = require("../common/discordEmbed");
const { getSettings } = require("../config/settings");
const settings = getSettings();
const { getCurrentPO } = require("../common/trackingSystem");

/**
 * Find discord channel object
 * @param message | discord message
 * @param channelName | string
 * @returns discord channel
 */
const findChannelByName = (message, channelName) => {
  return message.guild.channels.cache.find((ch) => ch.name == channelName);
};

/**
 * Find discord role object
 * @param message | discord message
 * @param roleName | string
 * @returns discord role
 */
const findServerRoleByName = (message, roleName) => {
  return message.guild.channels.role.find((r) => r.name == roleName);
};

/**
 * Read specified file on specified directory
 * @param dir | folder name + filename
 * @returns promise
 */
const readJson = (dir) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(process.cwd(), dir), "utf8", (err, data) => {
      if (err) {
        reject({
          success: false,
          err: err,
        });
      } else {
        const json = JSON.parse(data);
        if (json) {
          resolve({
            success: true,
            result: json,
          });
        }
      }
    });
  });
};

/**
 * Update/ write specified file on specified directory
 * @param dir | folder name + filename
 * @param data | json
 * @returns promise
 */
const writeJson = (dir, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(
      path.join(process.cwd(), dir),
      JSON.stringify(data),
      "utf8",
      (err, data) => {
        if (err) {
          reject({
            success: false,
            err: err,
          });
        } else {
          resolve({
            success: true,
            result: "File updated successfully.",
          });
        }
      }
    );
  });
};

/**
 * Display title queue on specified channel
 * @param message | discord message
 */
const displayQueue = async (message) => {
  /**
   * Object for queue details
   * for easy modification
   */
  const queueDetails = {
    title: "**K40 Title Buff Queue",
    footer:
      "MAD! MAD! MAD! MAD! MAD! MAD! MAD! MAD! MAD! MAD! MAD! MAD! MAD! MAD!",
  };
  const channel = findChannelByName(message, settings.QUEUE_CHANNEL);
  /**
   * Delete channel messages
   * up to 100
   */
  await channel.bulkDelete(100);
  const r = await readJson("/data/queue.json");

  if (r.success) {
    channel.send(embed(r.result, queueDetails.title, queueDetails.footer));
  } else {
    channel.send("Oops. Something went wrong...");
  }
};

/**
 * Container for title buffs
 * used for the queueing system
 */
const titleConstants = () => {
  return {
    GRAND_MAESTER: "Grand Maester",
    CHIEF_BUILDER: "Chief Builder",
    MASTER_OF_SHIPS: "Master of Ships",
    MASTER_OF_WHISPERERS: "Master of Whisperers",
    LORD_COMMANDER: "Lord Commander",
  };
};

/**
 * Get available account name
 * from discord, options are:
 * - account name
 * - server nickname
 * @param message | discord message
 * @returns string
 */
const getAvailableAccountName = (message) => {
  const accountDetail = message.guild.member(message.author);

  if (accountDetail.nickname) {
    return accountDetail.nickname;
  }

  return accountDetail.user.name;
};

/**
 * Get user account username or nickname
 * @param message | discord message
 * @returns string
 */
const getAccountNameFromCommandRequest = (message) => {
  // Keywords to ignore
  const ignore = ["pls", "please", "plz", "pls?", "please?", "plz"];

  const content = message.content.split(" ");
  let filteredContent = content.filter((e) => {
    return !e.startsWith("<") && !e.startsWith("!");
  });

  // Create one whole string from values left after filter
  if (filteredContent.length > 1) {
    filteredContent = filteredContent.join(" ");
  } else {
    filteredContent = filteredContent.toString();
  }

  // Check if there a third argument present (alt's name)
  if (filteredContent && !ignore.includes(filteredContent)) {
    return filteredContent;
  }

  // Else send default account or server name
  return getAvailableAccountName(message);
};

/**
 * Check for requesting user
 * if currently included
 * on any queue
 *
 * @param queue | json
 * @param user | string
 * @returns boolean
 */
const checkIfUserIsInQueue = (queue, requestingUser) => {
  const q = queue.value;
  if (Array.isArray(q) && q.includes(requestingUser)) {
    return true;
  }

  return false;
};

const queueingSystem = async (message, titleBuff) => {
  const r = await readJson("/data/buff-mode.json");

  if (r.success) {
    const d = r.result;
    const mode = d["buff-mode"];
    const title = titleConstants();

    if (
      // Determine if buff mode is inactive and title request is Lord Commander
      (!mode && titleBuff == title.LORD_COMMANDER) ||
      // Determine if buff mode is active and title other than Lord Commander is requested
      (mode && titleBuff != title.LORD_COMMANDER) ||
      // Check if there is a Protocol Officer active
      !getCurrentPO(message)
    ) {
      message.react("❌");
      return false;
    }

    const requestingUser = getAccountNameFromCommandRequest(message);
    console.log(requestingUser);
    const queue = await readJson("/data/queue.json");

    if (queue.success) {
      // Modify queue for new command requested
      let result = queue.result;
      for (let title of result) {
        if (title.name == titleBuff) {
          if (checkIfUserIsInQueue(title, requestingUser)) {
            message.channel.send(
              "You are already in a queue! Please finish the current one first. Thank you."
            );
            break;
          } else {
            if (!Array.isArray(title.value)) {
              title.value = [];
            }

            // Add current requesting user to the queue
            title.value.push(requestingUser);

            const isQueueUpdated = await writeJson("data/queue.json", result);
            if (isQueueUpdated) {
              message.react("☑️");
              message.channel.send(
                `${message.author}, ${requestingUser} added to the ${titleBuff} queue.`
              );
              displayQueue(message);
            }
            break;
          }
        }
      }
    }
  }
};

const removeNameInQueue = async (message, requestingUser) => {
  const r = await readJson("/data/queue.json");

  if (r.success) {
    /**
     * Get title queue of
     * where requesting user exists
     */
    let result = r.result;
    let titleWhereRequestingUserExists;
    for (let titles of result) {
      console.log(checkIfUserIsInQueue(titles, requestingUser));
      if (checkIfUserIsInQueue(titles, requestingUser)) {
        // Filter out requesting user from the title
        titles.value = titles.value.filter((e) => {
          return e != requestingUser;
        });

        // Replace empty queue array with empty indicator
        if (titles.value.length <= 0) {
          titles.value = "[EMPTY]";
        }

        const isUpdated = await writeJson("/data/queue.json", result);
        if (isUpdated.success) {
          message.react("✅");
          displayQueue(message);
        } else {
          message.channel.send("You are not in any queue.");
        }
        break;
      }
    }
  }
};

/**
 * Check if there is any person
 * that has PO role
 */
const hasPoAccessRole = (message) => {
  if (
    message.member.roles.cache.find(
      (role) => role.name === settings.PO_ACCESS_ROLE
    )
  ) {
    return true;
  }

  return false;
};

/**
 * Format date object
 * to return datetime
 */
const getDateTime = (d) => {
  const date = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const time = `${d.getHours()}:${d.getMinutes()}`;

  return date + " " + time;
};

/**
 * Check if channel is buff channel
 */
const checkChannelIfBuffChannel = (message) => {
  if (message.channel.name != settings.BUFF_CHANNEL) {
    return false;
  }

  return true;
};

/**
 * Send messages if user has no PO role
 */
const messageForUserThatHasNoPoAccess = (message) => {
  message.channel.send(
    `${message.author.toString()}, you do not have access for Protocol Officer!`
  );
};

module.exports = {
  readJson,
  writeJson,
  getDateTime,
  displayQueue,
  queueingSystem,
  titleConstants,
  hasPoAccessRole,
  findChannelByName,
  removeNameInQueue,
  findServerRoleByName,
  checkChannelIfBuffChannel,
  getAccountNameFromCommandRequest,
  messageForUserThatHasNoPoAccess,
};
