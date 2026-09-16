/**
 * Export an array of objects as a downloadable CSV file in the browser.
 */
export function downloadCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  // Extract headers
  const headers = Object.keys(rows[0]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          let val = row[header];
          if (val === null || val === undefined) {
            val = '';
          } else if (typeof val === 'object') {
            val = JSON.stringify(val);
          }
          // Escape quotes and wrap in quotes if contains comma/newline/quotes
          const stringVal = String(val).replace(/"/g, '""');
          if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"')) {
            return `"${stringVal}"`;
          }
          return stringVal;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
