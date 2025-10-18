import jsPDF from "jspdf"

interface NewsArticle {
  id: string
  title: string
  description: string
  link: string
  pubDate: string
  source: string
  imageUrl?: string
}

export function generatePDF(articles: NewsArticle[]) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Title
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("Pulse News Report", margin, yPosition)
  yPosition += 10

  // Date
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition)
  yPosition += 15

  // Articles
  articles.forEach((article, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    // Article number
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`${index + 1}. ${article.source}`, margin, yPosition)
    yPosition += 7

    // Title
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    const titleLines = doc.splitTextToSize(article.title, maxWidth)
    doc.text(titleLines, margin, yPosition)
    yPosition += titleLines.length * 7

    // Date
    doc.setFontSize(9)
    doc.setFont("helvetica", "italic")
    doc.text(new Date(article.pubDate).toLocaleString(), margin, yPosition)
    yPosition += 7

    // Description
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    const descLines = doc.splitTextToSize(article.description, maxWidth)
    doc.text(descLines, margin, yPosition)
    yPosition += descLines.length * 5 + 3

    // Link
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 255)
    doc.textWithLink("Read full article", margin, yPosition, { url: article.link })
    doc.setTextColor(0, 0, 0)
    yPosition += 12

    // Separator
    if (index < articles.length - 1) {
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10
    }
  })

  // Save PDF
  const filename = `pulse-news-${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(filename)
}
