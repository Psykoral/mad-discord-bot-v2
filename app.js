const fs = require('fs');
const Discord = require('discord.js');
const { PREFIX1, PREFIX2, TOKEN } = require('./config.json');
const client = new Discord.Client();
const { commandHandler } = require('./common/trackingSystem');

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

client.once('ready', () => {
	console.log('Ready!');
});

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.on('message', message => {
	
	commandHandler(client, message, PREFIX2);

	if (!message.content.startsWith(PREFIX1) || message.author.bot) return;
	
	const args = message.content.slice(PREFIX1.length);
	const command = args.trim().split(" ")[0];

	if (!client.commands.has(command)) return;

	try {
		client.commands.get(command).execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

client.login(TOKEN);