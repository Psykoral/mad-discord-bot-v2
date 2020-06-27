const { removeNameInQueue, getUser } = require('../common/utilities');
const config = require('../common/getConfig')();

module.exports = {
	name: 'done',
	description: 'Command to use when finish consuming title buff.',
	syntax: `${config.PREFIX1}done or ${config.PREFIX1}done <Username>`,
	includes: true,
	execute(message) {

		removeNameInQueue(message, getUser(message));
		
	}
};