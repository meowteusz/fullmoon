import { OpenAIStream } from "./openai-tiny.js";

// Grab references to important DOM components
const key_input = document.getElementById("apikey_input");
const chat_input = document.getElementById("chat_input");
const chat_window = document.getElementById("chat");

// Grab references to the templates. Storing these as functions means we're not
// writing huge structs to memory. Instead, they get fetched when needed and
// promptly go out of scope when their initiator function returns.
const message = () => (document.getElementById("message_template").content);

// Instantiate main objects
const gippity = new OpenAIStream();
let messages = [];

// Event Listeners
key_input.addEventListener("input", check_key);
chat_input.addEventListener("keydown", (e) => send_message(e));

// Expose functions to the window object
// lest ye suffer reference errors
window.messages = messages;

// Utility Functions
function check_key() {
    let api_key = key_input.value;

    if (api_key == "test") {
        console.log("dev mode on");
        key_input.style.setProperty("border-bottom-color", "#39FF77");
        gippity.api_key = api_key;
        return true;
    }

    if (api_key.length == 0) {
        console.error("No API key provided.");
        key_input.style.setProperty("border-bottom-color", "#DADADA");
        return false;
    }

    if (!api_key.startsWith("sk-proj-")) {
        console.error("Invalid API key provided.");
        key_input.style.setProperty("border-bottom-color", "#CB444A");
        return false;
    }

    if (api_key.length < 50) {
        console.error(
            "API key too short. Did you accidentally paste the project key?",
        );
        key_input.style.setProperty("border-bottom-color", "#CB444A");
        return false;
    }

    key_input.style.setProperty("border-bottom-color", "#408558");
    gippity.api_key = api_key;
}

async function respond() {
    // Don't do anything unless the key is valid
    if (gippity.api_key == "") {
        console.error("No API key provided.");
        return false;
    }

    const response = message().cloneNode(true);

    response.querySelector(".message").classList.add("completion");
    response.querySelector("textarea").classList.add("stream_here");
    response.querySelector("textarea").value = "Thinking...";
    
    chat_window.appendChild(response);

    // Should only ever be the one element with this class active
    let stream_here = document.querySelector(".stream_here");

    try {
        if (gippity.api_key == "test") {
            stream_here.value = "This is a test response.";
            stream_here.classList.remove("stream_here");

            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
            });

            return true;
        }

        const stream = await gippity.createCompletion(messages);
        let full_response = "";

        for await (const chunk of stream) {
            full_response += chunk;
            stream_here.value = full_response;
        }

        stream_here.classList.remove("stream_here");

        messages.push({ role: "assistant", content: full_response });

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
        });

        return full_response;
    } catch (error) {
        console.error("Error:", error);
    }
}

function add_user_message(content) {
    const query = message().cloneNode(true);
    query.querySelector("textarea").value = content;
    chat_window.appendChild(query);

    respond();
}

function send_message(event) {
    if (event.key === "Enter") {
        event.preventDefault();

        let content = chat_input.value;
        chat_input.value = "";

        messages.push({ "role": "user", "content": content });
        add_user_message(content);
    }
}

// Main
if (key_input.value) {
    check_key();
}
