/**
 * Collection of messages that are used multiple times throughout the codebase
 */
const messageForUserThatHasNoPoAccess = (message) => {
  message.channel.send(
    `${message.author.toString()}, you do not have access for Protocol Officer!`
  );
};

module.exports = {
  messageForUserThatHasNoPoAccess,
};
