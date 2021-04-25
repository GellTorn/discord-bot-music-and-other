const Discord = require('discord.js')
const ytdl = require('ytdl-core')
const tokens = require('./tokens.js')

const client = new Discord.Client()

const bot = {
  defaultPrefix: '/',
  defaultMusicBitrate: 9600,
}
const servers = {}

const playMusic = (connection, message) => {
  const server = servers[message.guild.id]
  if (!server.play) {
    message.channel.send(`Проигрываю \`${server.queue[0]}\``)
    console.log(`Youtube video ${server.queue[0]} playing`)

    const audioStream = ytdl(server.queue[0], {
      filter: `audioonly`,
      quality: 'highestaudio',
      opusEncoded: true,
    })

    server.dispatcher = connection.play(audioStream)
    server.play = true

    server.dispatcher.on('speaking', (isSpeaking) => {
      if (!isSpeaking) {
        const server = servers[message.guild.id]
        server.queue.shift()
        server.play = false
        if (server.queue[0]) {
          playMusic(connection, message)
        } else {
          connection.disconnect()
        }
      }
    })
  } else {
    const newAudio = server.queue[server.queue.length - 1]
    message.channel.send(`Добавленно в очередь \`${newAudio}\``)
    console.log(`Youtube video added to queue ${newAudio}`)
  }
}

client.on('guildMemberAdd', (member) => {
  const announse = (channel) => {
    console.log(`New guild member ${member.nickname}`)
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
    console.log(`Emoji create ${emoji.name}`)
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
    console.log(`Emoji delete ${emoji.name}`)
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

client.on('emojiUpdate', (oldEmoji, newEmoji) => {
  const announse = (channel) => {
    console.log(`Emoji update ${newEmoji.name}`)

    channel.send(`Мы обновили смайлик ${oldEmoji} -> ${newEmoji}!`)
  }

  const channel = newEmoji.guild.channels.find((channel) => channel.name === 'объявления')
  if (!channel) {
    newEmoji.guild
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
  const guildId = message.guild.id

  if (!servers[guildId]) {
    servers[guildId] = {
      prefix: bot.defaultPrefix,
      queue: [],
    }
  }

  const server = servers[guildId]
  const args = message.content.substring(servers[guildId].prefix.length).split(' ')

  if (message.author.equals(client.user)) return
  if (!message.content.startsWith(servers[guildId].prefix)) return

  console.log(`Command ${message.content} by user ${message.author.username}`)

  switch (args[0].toLowerCase()) {
    case 'help':
      message.channel.send(
        `Привет я **${client.user.username}**!
\`${server.prefix}play [youtube url]\` для проигрывания музыки или добавления ее в очередь
\`${server.prefix}skip\` пропустить трек
\`${server.prefix}queue\` посмотреть очередь
\`${server.prefix}prefix [новый префикс]\` ...
\`${server.prefix}join\` для присоединения к Вашему голосовому каналу
\`${server.prefix}leave\` для отключения от голосового канала
\`${server.prefix}ping\` задержка до бота
\`${server.prefix}uptime\` uptime бота
`
      )
      break
    case 'ping':
      message.channel.send(`${client.ws.ping}мс`)
      break
    case 'prefix':
      if (!args[1]) {
        message.channel.send(`Отправьте эту команду с новым префиксом`)
      } else {
        server.prefix = args[1]
        message.channel.send(`Новый префикс бота \`${server.prefix}\``)
      }
      break
    case 'queue':
      if (server.queue.length === 0) {
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
      if (message.member.voice.channel) {
        if (message.member.voice.channel.bitrate !== bot.defaultMusicBitrate) {
          message.member.voice.channel
            .setBitrate(bot.defaultMusicBitrate)
            .then((vc) => message.channel.send(`Установил битрейт ${vc.bitrate}кб/сек для канала ${vc.name}`))
            .catch(console.log)
        }

        message.member.voice.channel
          .join()
          .then((connection) => {
            if (!args[1]) {
              message.channel.send(`Нужна ссылка на youtube видео!`)
            } else {
              server.queue.push(args[1])
              playMusic(connection, message)
            }
          })
          .catch(console.log)
      } else {
        message.channel.send(`Сначала Вам нужно подключится к голосовому каналу!`)
      }
      break
    case 'join':
      message.member.voice.channel.join()
      break
    case 'leave':
      if (message.guild.voice.channel) {
        message.guild.voice.channel.leave()
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
      if (server.dispatcher) {
        server.dispatcher.pause()
        server.queue.shift()
      }
      break
    default:
      message.channel.send(`Неизвестная команда!`)
      break
  }
})

client.on('ready', () => {
  console.log(`Connected as ${client.user.username}`)
})

client.login(tokens.discordApi)
console.log('Bot started!')
