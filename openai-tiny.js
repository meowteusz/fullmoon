export class OpenAIStream {
    constructor() {
        this.api_key = "CHANGE_ME";
        this.base_url = "https://api.openai.com/v1/chat/completions";
    }

    async createCompletion(messages, options = {}) {
        const defaults = {
            model: "gpt-4o",
            stream: true,
        };

        const requestBody = {
            ...defaults,
            ...options,
            messages: messages,
        };

        try {
            const response = await fetch(this.base_url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.api_key}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    `OpenAI API Error: ${
                        error.error?.message || response.statusText
                    }`,
                );
            }

            if (!response.body) {
                throw new Error("ReadableStream not supported");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            return {
                async *[Symbol.asyncIterator]() {
                    try {
                        while (true) {
                            const { done, value } = await reader.read();

                            if (done) {
                                break;
                            }

                            buffer += decoder.decode(value, { stream: true });
                            const lines = buffer.split("\n");

                            // Keep the last partial line in the buffer
                            buffer = lines.pop() || "";

                            for (const line of lines) {
                                if (line.startsWith("data: ")) {
                                    const data = line.slice(6);

                                    if (data === "[DONE]") {
                                        return;
                                    }

                                    try {
                                        const parsed = JSON.parse(data);
                                        const content = parsed.choices[0]?.delta
                                            ?.content;
                                        if (content) {
                                            yield content;
                                        }
                                    } catch (e) {
                                        console.warn(
                                            "Failed to parse SSE message:",
                                            e,
                                        );
                                    }
                                }
                            }
                        }
                    } finally {
                        reader.releaseLock();
                    }
                },
            };
        } catch (error) {
            console.error("Stream creation failed:", error);
            throw error;
        }
    }
}
