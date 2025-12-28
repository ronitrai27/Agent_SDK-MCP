import 'dotenv/config';
import { OpenAI } from 'openai';

const client = new OpenAI();
client.conversations.create({}).then(e => {
    console.log(`SESSION CREATED ID==`, e.id)
})