const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const GoogleImages = require('google-images');
const tokens = require('./tokens.js');
const imageSearch = new GoogleImages(tokens.cse, tokens.googleApi);
const client = new Discord.Client();

const bot = {
	prefix: '/',
	name: 'Mad Bot',
};
const servers = {};

const playMusic = (connection, message) => {
	var server = servers[message.guild.id];
	if(!server.play) {
		message.channel.send(`Проигрываю \`${server.queue[0]}\``);
		server.dispatcher = connection.playStream(ytdl(server.queue[0], {filter: `audioonly`}));
		server.play = true;
	}
	else {
		message.channel.send(`Добавленно в очередь \`${server.queue[server.queue.length - 1]}\``);
	}
	
	server.dispatcher.on('end', () => {
		var server = servers[message.guild.id];
		server.queue.shift();
		server.play = false;
		if(server.queue[1]){
			playMusic(connection, message);
		}
		else{
			connection.disconnect();
		}
	});
};

client.on('guildMemberAdd', member => {
	var announse = channel => {
		channel.send(
`Добро пожаловать на сервер, ${member}.
Чтобы узнать о командах сервера набери \`${bot.prefix}help\``
		);
	};
	
	var channel = member.guild.channels.find(channel => channel.name === 'приветствия');
	if (!channel) {
		member.guild.createChannel('приветствия', 'text', [{deny: ['SEND_MESSAGES']}])
		.then((channel) => {
			announse(channel);
		})
		.catch(console.log)
	}
	else {
		announse(channel);
	}
});

client.on('emojiCreate', emoji => {
	var announse = channel => {
		channel.send(
`У нас новый смайлик - ${emoji} !`
		);
	};
	
	var channel = emoji.guild.channels.find(channel => channel.name === 'объявления');
	if (!channel) {
		emoji.guild.createChannel('объявления', 'text', [{deny: ['SEND_MESSAGES']}])
		.then((channel) => {
			announse(channel);
		})
		.catch(console.log)
	}
	else {
		announse(channel);
	}
});

client.on('emojiDelete', emoji => {
	var announse = channel => {
		channel.send(
`Мы удалили смайлик ${emoji}, RIP!`
		);
	};
	
	var channel = emoji.guild.channels.find(channel => channel.name === 'объявления');
	if (!channel) {
		emoji.guild.createChannel('объявления', 'text', [{deny: ['SEND_MESSAGES']}])
		.then((channel) => {
			announse(channel);
		})
		.catch(console.log)
	}
	else {
		announse(channel);
	}
});

client.on('emojiUpdate', emoji => {
	var announse = channel => {
		channel.send(
`Мы обновили смайлик ${emoji}!`
		);
	};
	
	var channel = emoji.guild.channels.find(channel => channel.name === 'объявления');
	if (!channel) {
		emoji.guild.createChannel('объявления', 'text', [{deny: ['SEND_MESSAGES']}])
		.then((channel) => {
			announse(channel);
		})
		.catch(console.log)
	}
	else {
		announse(channel);
	}
});

client.on('message', message => {
	if(message.author.equals(client.user))
		return;
	if(!message.content.startsWith(bot.prefix))
		return;
	
	var args = message.content.substring(bot.prefix.length).split(' ');
	
	switch(args[0].toLowerCase()){
		case 'help':
			message.channel.send(
`Привет я **${bot.name}**!
\`${bot.prefix}play [youtube url]\` для проигрывания музыки или добавления ее в очередь
\`${bot.prefix}skip\` пропустить трек
\`${bot.prefix}queue\` посмотреть очередь
\`${bot.prefix}prefix [новый префикс]\` ...
\`${bot.prefix}join\` для присоединения к Вашему голосовому каналу
\`${bot.prefix}leave\` для отключения от голосового канала
\`${bot.prefix}ping\` задержка до бота
\`${bot.prefix}uptime\` uptime бота
\`${bot.prefix}boobs\` nsfw
\`${bot.prefix}meme\` случайный мем`
			);
			break;
		case 'ping':
			message.channel.send(`${client.ping}мс`);
			break;
		case 'prefix':
			if(!args[1]){
				message.channel.send(`Введите новый префикс`);
			}
			else {
				bot.prefix = args[1];
				message.channel.send(`Новый префикс бота \`${bot.prefix}\``);
			}
			break;
		case 'queue':
			if(servers[message.guild.id] === undefined || servers[message.guild.id].queue === undefined) {
				message.channel.send('Очередь пуста');
			}
			else {
				var server = servers[message.guild.id];
				var newMessage = '`';
				for(let x = 0; x < server.queue.length; x++){
					newMessage += (x + 1) + ' - ' + server.queue[x] + '\n';
				}
				newMessage += '`';
				message.channel.send(newMessage);
			}
			break; 
		case 'play':
			if(message.member.voiceChannel) {
				var bitrate = 64;
				if(message.member.voiceChannel.bitrate > bitrate || message.member.voiceChannel.bitrate < bitrate) {
					message.member.voiceChannel.setBitrate(bitrate)
						.then(vc => message.channel.send(`Установил битрейт ${vc.bitrate}кб/сек для канала ${vc.name}`))
						.catch(console.log);
				}
				message.member.voiceChannel.join()
					.then(connection => {
						if(!args[1]){
							message.channel.send(`Нужна ссылка на youtube видео!`);
						}
						else {
							if(!servers[message.guild.id]) {
								servers[message.guild.id] = {
									queue: [],
								};
							}
							servers[message.guild.id].queue.push(args[1]);
							playMusic(connection, message);
						}
					})
					.catch(console.log);
			}
			else {
				message.channel.send(`Сначала Вам нужно подключится к голосовому каналу!`);
			}
			break;
		case 'join':
			message.member.voiceChannel.join();
			break;
		case 'leave':
			if(message.guild.voiceConnection){
				message.guild.voiceConnection.disconnect();
			}
			break;
		case 'uptime':
			message.channel.send(`${client.uptime}мс`);
			break;
		case 'pause':
			var server = servers[message.guild.id];
			if(server.dispatcher) {
				server.dispatcher.pause();
				message.channel.send(`Пауза`);
			}
			break;
		case 'resume':
			var server = servers[message.guild.id];
			if(server.dispatcher) {
				server.dispatcher.resume();
				message.channel.send(`Продолжаем`);
			}
			break;
		case 'boobs':
			if(!message.channel.nsfw){
				message.channel.send(`Это должен быть nsfw чат!`);
			}
			else {
				imageSearch.search('erotic boobs 18+') // хз, короче сами напишите
					.then(images => {
						message.channel.send('', {page: Math.floor(Math.random() * 100), files: [images[Math.floor(images.length * Math.random())].url.toString()]})
							.then(message => {
								message.react('👍')
									.then(() => {
									message.react('👎');
								});
							})
							.catch(console.log);
					});
			}
			break;
		case 'meme':
			imageSearch.search('dank meme')
				.then(images => {
					message.channel.send('', {page: Math.floor(Math.random() * 100), files: [images[Math.floor(images.length * Math.random())].url.toString()]})
						.then(message => {
							message.react('👍')
								.then(() => {
									message.react('👎');
								});
						})
						.catch(console.log);
				});
			break;
		case 'skip':
			var server = servers[message.guild.id];
			if(server.dispatcher)
				server.dispatcher.end();
			break;
		default:
			message.channel.send(`Неизвестная команда!`);
			break;
	}
});

client.login(tokens.discordApi);
