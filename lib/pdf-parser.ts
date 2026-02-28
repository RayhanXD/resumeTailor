let pdfJsLoaded = false;
let pdfJsLoadPromise: Promise<void> | null = null;

/**
 * Dynamically loads pdf.js from CDN
 */
function loadPdfJs(): Promise<void> {
  if (pdfJsLoaded) return Promise.resolve();

  if (pdfJsLoadPromise) return pdfJsLoadPromise;

  pdfJsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      pdfJsLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js library'));
    document.head.appendChild(script);
  });

  return pdfJsLoadPromise;
}

/**
 * Extracts text content from a PDF file using pdf.js from CDN
 * @param file - PDF file to parse
 * @returns Extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  // Ensure pdf.js is loaded
  await loadPdfJs();

  const pdfjsLib = (window as any).pdfjsLib;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file. Please ensure it is a valid PDF.');
  }
}
