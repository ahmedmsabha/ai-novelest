// Test the story generation API endpoint
async function testStoryGeneration() {
    console.log("Testing story generation API...\n")

    try {
        const response = await fetch("http://localhost:3000/api/generate-story", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: "A brave knight fights a dragon",
                genre: "fantasy",
                tone: "adventurous",
                length: "short",
                storyType: "story",
            }),
        })

        if (!response.ok) {
            const error = await response.text()
            console.error("Error response:", response.status, error)
            return
        }

        if (!response.body) {
            console.error("No response body")
            return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullText = ""
        let chunkCount = 0

        console.log("Reading stream...\n")
        console.log("---START OF STREAM---")

        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                console.log("\n---END OF STREAM---")
                break
            }

            const chunk = decoder.decode(value, { stream: true })
            chunkCount++

            console.log(`\n[Chunk ${chunkCount}]`)
            console.log("Raw:", JSON.stringify(chunk.substring(0, 200)))

            const lines = chunk.split("\n")
            for (const line of lines) {
                if (line.trim()) {
                    console.log("Line:", line.substring(0, 150))

                    if (line.startsWith("data: ")) {
                        const dataStr = line.slice(6).trim()
                        if (dataStr && dataStr !== "[DONE]") {
                            try {
                                const data = JSON.parse(dataStr)
                                // Handle text-delta events
                                if (data.type === "text-delta" && data.delta) {
                                    fullText += data.delta
                                }
                            } catch (e) {
                                console.error("Parse error:", e.message)
                            }
                        }
                    } else if (line.startsWith("0:")) {
                        const jsonStr = line.slice(2).trim()
                        if (jsonStr && jsonStr !== '""') {
                            try {
                                const text = jsonStr.startsWith('"') && jsonStr.endsWith('"')
                                    ? JSON.parse(jsonStr)
                                    : jsonStr
                                fullText += text
                            } catch (e) {
                                console.error("Parse error:", e.message)
                            }
                        }
                    }
                }
            }
        }

        console.log("\n\n=== FINAL RESULTS ===")
        console.log("Total chunks received:", chunkCount)
        console.log("Full text length:", fullText.length, "characters")
        console.log("\nFirst 500 characters of story:")
        console.log(fullText.substring(0, 500))
        console.log("\n...last 200 characters:")
        console.log(fullText.substring(fullText.length - 200))
    } catch (error) {
        console.error("Test failed:", error.message)
        console.error(error.stack)
    }
}

testStoryGeneration()
