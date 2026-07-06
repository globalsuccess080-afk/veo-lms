import * as xlsx from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const handleExportData = (
  data: any[],
  columns: { header: string; dataKey: string }[],
  format: 'csv' | 'xlsx' | 'pdf',
  filename: string
) => {
  if (!data || data.length === 0) return

  // Format data for xlsx
  const formattedData = data.map((item) => {
    const row: any = {}
    columns.forEach((col) => {
      // Handle nested or simple keys
      const keys = col.dataKey.split('.')
      let val = item
      keys.forEach((k) => {
        val = val ? val[k] : ''
      })
      row[col.header] = val
    })
    return row
  })

  if (format === 'csv' || format === 'xlsx') {
    const ws = xlsx.utils.json_to_sheet(formattedData)
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'Data')
    xlsx.writeFile(wb, `${filename}.${format}`)
  } else if (format === 'pdf') {
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(16)
    doc.text(filename.replace(/_/g, ' ').toUpperCase(), 14, 15)
    doc.setFontSize(10)
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 22)

    const tableData = formattedData.map((row) => columns.map((col) => String(row[col.header] || '')))
    
    // Get the current theme's primary color
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#6366f1'
    
    autoTable(doc, {
      head: [columns.map((col) => col.header)],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: primaryColor }
    })

    doc.save(`${filename}.pdf`)
  }
}
