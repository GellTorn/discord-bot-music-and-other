const Discord = require('discord.js')
const ytdl = require('ytdl-core')
const tokens = require('./tokens.js')

const client = new Discord.Client()

const bot = {
  prefix: '/',
  name: 'Mad Bot',
}
const servers = {}

const playMusic = (connection, message) => {
  const server = servers[message.guild.id]
  if (!server.play) {
    message.channel.send(`Проигрываю \`${server.queue[0]}\``)

    const audioStream = ytdl(server.queue[0], {
      filter: `audioonly`,
      opusEncoded: true,
    })

    server.dispatcher = connection.playStream(audioStream)
    server.play = true

    server.dispatcher.on('end', () => {
      const server = servers[message.guild.id]
      server.queue.shift()
      server.play = false
      if (server.queue[0]) {
        playMusic(connection, message)
      } else {
        connection.disconnect()
      }
    })
  } else {
    message.channel.send(`Добавленно в очередь \`${server.queue[server.queue.length - 1]}\``)
  }
}

client.on('guildMemberAdd', (member) => {
  const announse = (channel) => {
    channel.send(
      `Добро пожаловать на сервер, ${member}.
Чтобы узнать о командах сервера набери \`${bot.prefix}help\``
    )
  }

  const channel = member.guild.channels.find((channel) => channel.name === 'приветствия')
  if (!channel) {
    member.guild
      .createChannel('приветствия', 'text', [{ deny: ['SEND_MESSAGES'] }])
      .then((channel) => {
        announse(channel)
      })
      .catch(console.log)
  } else {
    announse(channel)
  }
})

client.on('emojiCreate', (emoji) => {
  const announse = (channel) => {
    channel.send(`У нас новый смайлик - ${emoji} !`)
  }

  const channel = emoji.guild.channels.find((channel) => channel.name === 'объявления')
  if (!channel) {
    emoji.guild
      .createChannel('объявления', 'text', [{ deny: ['SEND_MESSAGES'] }])
      .then((channel) => {
        announse(channel)
      })
      .catch(console.log)
  } else {
    announse(channel)
  }
})

client.on('emojiDelete', (emoji) => {
  const announse = (channel) => {
    channel.send(`Мы удалили смайлик ${emoji}, RIP!`)
  }

  const channel = emoji.guild.channels.find((channel) => channel.name === 'объявления')
  if (!channel) {
    emoji.guild
      .createChannel('объявления', 'text', [{ deny: ['SEND_MESSAGES'] }])
      .then((channel) => {
        announse(channel)
      })
      .catch(console.log)
  } else {
    announse(channel)
  }
})

client.on('emojiUpdate', (emoji) => {
  const announse = (channel) => {
    channel.send(`Мы обновили смайлик ${emoji}!`)
  }

  const channel = emoji.guild.channels.find((channel) => channel.name === 'объявления')
  if (!channel) {
    emoji.guild
      .createChannel('объявления', 'text', [{ deny: ['SEND_MESSAGES'] }])
      .then((channel) => {
        announse(channel)
      })
      .catch(console.log)
  } else {
    announse(channel)
  }
})

client.on('message', (message) => {
  if (message.author.equals(client.user)) return
  if (!message.content.startsWith(bot.prefix)) return

  const args = message.content.substring(bot.prefix.length).split(' ')
  const server = servers[message.guild.id]

  switch (args[0].toLowerCase()) {
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
\`${bot.prefix}meme\` случайный мем`
      )
      break
    case 'ping':
      message.channel.send(`${client.ping}мс`)
      break
    case 'prefix':
      if (!args[1]) {
        message.channel.send(`Введите новый префикс`)
      } else {
        bot.prefix = args[1]
        message.channel.send(`Новый префикс бота \`${bot.prefix}\``)
      }
      break
    case 'queue':
      if (!server || !servers[message.guild.id].queue) {
        message.channel.send('Очередь пуста')
      } else {
        let newMessage = '`'
        for (let x = 0; x < server.queue.length; x++) {
          newMessage += x + 1 + ' - ' + server.queue[x] + '\n'
        }
        newMessage += '`'
        message.channel.send(newMessage)
      }
      break
    case 'play':
      if (message.member.voiceChannel) {
        const bitrate = 96
        if (message.member.voiceChannel.bitrate > bitrate || message.member.voiceChannel.bitrate < bitrate) {
          message.member.voiceChannel
            .setBitrate(bitrate)
            .then((vc) => message.channel.send(`Установил битрейт ${vc.bitrate}кб/сек для канала ${vc.name}`))
            .catch(console.log)
        }
        message.member.voiceChannel
          .join()
          .then((connection) => {
            if (!args[1]) {
              message.channel.send(`Нужна ссылка на youtube видео!`)
            } else {
              if (!servers[message.guild.id]) {
                servers[message.guild.id] = {
                  queue: [],
                }
              }
              servers[message.guild.id].queue.push(args[1])
              playMusic(connection, message)
            }
          })
          .catch(console.log)
      } else {
        message.channel.send(`Сначала Вам нужно подключится к голосовому каналу!`)
      }
      break
    case 'join':
      message.member.voiceChannel.join()
      break
    case 'leave':
      if (message.guild.voiceConnection) {
        message.guild.voiceConnection.disconnect()
      }
      break
    case 'uptime':
      message.channel.send(`${client.uptime}мс`)
      break
    case 'pause':
      if (server.dispatcher) {
        server.dispatcher.pause()
        message.channel.send(`Пауза`)
      }
      break
    case 'resume':
      if (server.dispatcher) {
        server.dispatcher.resume()
        message.channel.send(`Продолжаем`)
      }
      break
    case 'skip':
      if (server.dispatcher) server.dispatcher.end()
      break
    default:
      message.channel.send(`Неизвестная команда!`)
      break
  }
})

client.login(tokens.discordApi)
