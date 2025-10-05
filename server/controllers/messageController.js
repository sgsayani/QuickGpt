// text based AI chat message controller

import { response } from "express"
import Chat from "../models/chat.js"
import user from "../models/user.js"
import axios from "axios"
import imageKit from "../configs/imageKit.js"
import openai from "../configs/openai.js"

export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id
        if(req.user.credits<1){
            return res.json({ success: false, message: "You don't have enough credits to use this feature." });
        }


        const { chatId, prompt } = req.body

        const chat = await Chat.findOne({ _id: chatId, userId })
        chat.messages.push({
            role: 'user', content: prompt, timestamp: Date.now(),
            isImage: false
        })

        const { choices } = await openai.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
        const reply = { ...choices[0].message, timestamp: Date.now(), isImage: false }
        res.json({ success: true, reply })

        chat.messages.push(reply)
        await chat.save()

        await user.updateOne({ _id: userId }, { $inc: { credits: -1 } })
    }
    catch (error) {
        res.json({ success: false, message: error.message })
    }
}


// API controller for getting IMAGE

export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id;
        // check credits
        if (req.user.credits < 2) {
            return res.json({ success: false, message: "You don't have enough credits to use this feature." });
        }
        const { prompt, chatId, isPublished } = req.body
        // find chat
        const chat = await Chat.findOne({ _id: chatId, userId })

        // push user msg
        chat.messages.push({
            role: 'user',
            content: prompt,
            timestamp: Date.now(),
            isImage: false
        });

        // encode promt
        const encodedPrompt = encodeURIComponent(prompt);

        // construct imagekit AI generation  url
        const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.png?tr=w-800,h-800`;
        // trigger generation by fetching from Imagekit
        const aiImageResponse = await axios.get(generatedImageUrl, { responseType: "arraybuffer" })

        // convert to base64
        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data, "binary").toString('base64')}`;

        // upload to imagekit media library

        const uploadResponse = await imageKit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "quickgpt"
        })
        const reply = {
            role: 'assistant',
            content: uploadResponse.url,
            timestamp: Date.now(),
            isImage: true,
            isPublished
        }
        res.json({ success: true, reply })

        chat.messages.push(reply)
        await chat.save()
        // remove credits if image then 2 credit will remove
        await user.updateOne({ _id: userId }, { $inc: { credits: -2 } })

    }

    catch (error) {
        res.json({ success: false, message: error.message })
    }
}