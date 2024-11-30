const { Client, GatewayIntentBits } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const conversationHistory = []; // Array untuk menyimpan riwayat percakapan


const genAI = new GoogleGenerativeAI(process.env.GEMINI_TOKEN);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function chatWithModel(userPrompt) {
  // Tambahkan prompt pengguna ke riwayat
  conversationHistory.push({ role: "pengguna", content: userPrompt });

  // Buat input dengan menggabungkan semua riwayat
  const input = conversationHistory
    .map((entry) => `${entry.role}: ${entry.content}`)
    .join("\n");

  // Kirim permintaan ke model
  const result = await model.generateContent(input);
  const textGenerated = result.response.text();

  // Simpan respons model ke riwayat
  conversationHistory.push({ role: "assisten", content: textGenerated });

  return textGenerated;
}

client.once("ready", () => {
  console.log("Bot aktif dan siap digunakan!");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Abaikan pesan dari bot

  if (message.content === "!ping") {
    message.reply("Pong!");
  } else if (message.content === "test fathir") {
    message.reply("ohh ini ya pembuat bot nya xixixi");
  }

  if (message.content === "!about") {
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("Tentang Bot")
      .setDescription("Ini adalah bot Discord buatan Alfthrpy")
      .addFields({
        name: "Fitur",
        value:
          "- Menggunakan AI Model Gemini langsung\n- Dapat mengirim ulang sebuah file",
      });

    message.channel.send({ embeds: [embed] });
  }

  if (message.content.startsWith("!kirimlagi")) {
    if (message.attachments.size > 0) {
      message.attachments.forEach((attachment) => {
        message.channel.send({
          content: `Berikut adalah file yang Anda minta untuk dikirim ulang: **${attachment.name}**`,
          files: [attachment.url],
        });
      });
    } else {
      message.reply("Tidak ada file dalam pesan Anda untuk dikirim ulang.");
    }
  }

  // Prompting Gemini API
  if (message.content.startsWith("!prompt ")) {
    const prompt = message.content.replace("!prompt ", "").trim();

    if (!prompt) {
      return message.reply("Silakan masukkan teks setelah perintah `!prompt`.");
    }

    try {
      const result = await chatWithModel(prompt);
      if (result.length > 2000) {
        const chunks = result.match(/.{1,2000}/g); // Potong setiap 2000 karakter
        for (const chunk of chunks) {
          await message.channel.send(chunk);
        }
      } else {
        message.reply(result);
      }
    } catch (error) {
      console.error("Error fetching Gemini API:", error.message);
      message.reply("Maaf, terjadi kesalahan saat menghubungi Gemini API.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
