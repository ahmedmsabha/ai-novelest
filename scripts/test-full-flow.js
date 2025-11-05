// Test the complete story generation and save flow
async function testFullFlow() {
    console.log("🧪 Testing complete story generation and save flow...\n")

    // Step 1: Generate a story
    console.log("Step 1: Generating story...")
    const generateResponse = await fetch("http://localhost:3000/api/generate-story", {
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

    if (!generateResponse.ok) {
        const error = await generateResponse.text()
        console.error("❌ Generation failed:", generateResponse.status, error)
        return
    }

    const reader = generateResponse.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ""
    let chunkCount = 0

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        chunkCount++

        const lines = chunk.split("\n")
        for (const line of lines) {
            if (line.trim() && line.startsWith("data: ")) {
                const dataStr = line.slice(6).trim()
                if (dataStr && dataStr !== "[DONE]") {
                    try {
                        const data = JSON.parse(dataStr)
                        if (data.type === "text-delta" && data.delta) {
                            fullText += data.delta
                        }
                    } catch (e) {
                        // Skip
                    }
                }
            }
        }
    }

    console.log(`✅ Story generated! Length: ${fullText.length} characters`)
    console.log("First 200 chars:", fullText.substring(0, 200))

    // Extract title
    const titleMatch = fullText.match(/^#\s*(.+)$/m)
    const title = titleMatch ? titleMatch[1].trim() : "Test Story"
    console.log("Title extracted:", title)

    // Step 2: Save the story (this will fail without auth, but we can test the endpoint)
    console.log("\nStep 2: Testing save endpoint (will fail without auth)...")
    const saveResponse = await fetch("http://localhost:3000/api/stories", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            title: title,
            content: fullText,
            genre: "fantasy",
            tone: "adventurous",
            length: "short",
            prompt: "A brave knight fights a dragon",
            storyType: "story",
        }),
    })

    if (saveResponse.ok) {
        const result = await saveResponse.json()
        console.log("✅ Story saved with ID:", result.id)
    } else {
        const errorText = await saveResponse.text()
        console.log("⚠️  Save failed (expected without auth):", saveResponse.status, errorText)
    }

    // Step 3: Check database
    console.log("\nStep 3: Checking database...")
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.NEON_DATABASE_URL)

    const stories = await sql`SELECT id, title, LENGTH(content) as content_length, created_at FROM stories ORDER BY created_at DESC LIMIT 5`

    if (stories.length > 0) {
        console.log("\n📚 Stories in database:")
        stories.forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.title} (${s.content_length} chars) - ${s.created_at}`)
        })
    } else {
        console.log("❌ No stories found in database")
    }
}

testFullFlow().catch(err => {
    console.error("Test failed:", err)
    process.exit(1)
})
