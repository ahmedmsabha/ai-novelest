import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const { title, content, genre, tone, storyType } = await request.json()

        // Process content: convert markdown headings and preserve formatting
        let processedContent = content
            // Remove the title if it's the first line starting with #
            .replace(/^#\s+.+\n\n?/, '')
            // Convert ## headings to h2
            .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
            // Convert # headings to h2 (in case there are more in the content)
            .replace(/^#\s+(.+)$/gm, '<h2>$1</h2>')
            // Convert **bold** to <strong>
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Convert *italic* to <em>
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // Escape HTML entities
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Restore our converted tags
            .replace(/&lt;h2&gt;(.+?)&lt;\/h2&gt;/g, '<h2>$1</h2>')
            .replace(/&lt;strong&gt;(.+?)&lt;\/strong&gt;/g, '<strong>$1</strong>')
            .replace(/&lt;em&gt;(.+?)&lt;\/em&gt;/g, '<em>$1</em>')
            // Convert newlines to paragraphs
            .split('\n\n')
            .map((para: string) => para.trim())
            .filter((para: string) => para.length > 0)
            .map((para: string) => para.startsWith('<h2>') ? para : `<p>${para.replace(/\n/g, '<br>')}</p>`)
            .join('\n')

        // Create a simple PDF-like format using HTML
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title.replace(/"/g, '&quot;')}</title>
  <style>
    @page {
      margin: 2cm;
    }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.8;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: white;
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 0.3em;
      color: #000;
      border-bottom: 3px solid #333;
      padding-bottom: 0.3em;
      font-weight: 700;
    }
    .meta {
      color: #666;
      font-style: italic;
      margin-bottom: 3em;
      font-size: 0.95em;
      padding: 10px 0;
    }
    .content {
      font-size: 1.15em;
      text-align: justify;
    }
    .content p {
      margin: 1.2em 0;
      text-indent: 2em;
    }
    .content p:first-of-type {
      text-indent: 0;
    }
    h2 {
      font-size: 1.8em;
      margin-top: 2em;
      margin-bottom: 0.8em;
      color: #1a1a1a;
      font-weight: 600;
      text-indent: 0;
    }
    strong {
      font-weight: 700;
      color: #000;
    }
    em {
      font-style: italic;
    }
    .footer {
      margin-top: 4em;
      padding-top: 1em;
      border-top: 2px solid #ddd;
      text-align: center;
      color: #999;
      font-size: 0.85em;
    }
    @media print {
      body {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <h1>${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>
  <div class="meta">
    <p><strong>Type:</strong> ${storyType === "novel" ? "Novel" : "Short Story"} | 
    <strong>Genre:</strong> ${genre} | 
    <strong>Tone:</strong> ${tone}</p>
  </div>
  <div class="content">
${processedContent}
  </div>
  <div class="footer">
    <p>Generated with StoryForge AI</p>
  </div>
</body>
</html>`

        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Content-Disposition": `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.html"`,
            },
        })
    } catch (error) {
        console.error("Error generating PDF:", error)
        return new NextResponse("Failed to generate PDF", { status: 500 })
    }
}
