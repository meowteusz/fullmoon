import { OpenAIStream } from "./openai-tiny.js";

// Grab references to important DOM components
const key_input = document.getElementById("apikey_input");
const chat_window = document.getElementById("chat");

// Grab references to the templates. Storing these as functions means we're not
// writing huge structs to memory. Instead, they get fetched when needed and
// promptly go out of scope when their initiator function returns.
const user_message =
    () => (document.getElementById("user_message_template").content);
const system_message =
    () => (document.getElementById("system_message_template").content);

// Instantiate main objects
const gippity = new OpenAIStream();
let messages = [];

// Event Listeners
key_input.addEventListener("input", check_key);
