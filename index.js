const userName = document.getElementById("name");
const submitBtn = document.getElementById("submitBtn");
const fileInput = document.getElementById("file");

const { PDFDocument, rgb, degrees } = PDFLib;

const generatePDF = async (name, event, year) => {
  const existingPdfBytes = await fetch("./assets/cert.pdf").then((res) =>
    res.arrayBuffer()
  );

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await fetch("./KaushanScript-Regular.ttf").then((res) =>
    res.arrayBuffer()
  );

  const KaushanFont = await pdfDoc.embedFont(fontBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  const fontSize = 45;
  const textWidth = KaushanFont.widthOfTextAtSize(name, fontSize);
  const { width: pageWidth } = firstPage.getSize();
  const centerX = (pageWidth - textWidth) / 2;
  const centerY = 330;

  firstPage.drawText(name, {
    x: centerX,
    y: centerY,
    size: fontSize,
    font: KaushanFont,
    color: rgb(0, 0, 0),
  });

  return await pdfDoc.save();
};

// Function to handle file processing
async function handleFile(file) {
  if (!file) {
    alert("Please select a file first!");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet);
    const formattedData = json.map(row => ({
      name: row.NAME,
      event: row.EVENT,
      year: row.YEAR
    }));

    console.log(formattedData);

    const zip = new JSZip();
    for (const data of formattedData) {
      const pdfBytes = await generatePDF(data.name, data.event, data.year);
      zip.file(`${data.name}_${data.event}.pdf`, pdfBytes);
    }

    zip.generateAsync({ type: "blob" }).then(function(content) {
      saveAs(content, "certificatesZip.zip");
    });
  };
  reader.readAsArrayBuffer(file);
}

// Trigger handleFile on submit button click
submitBtn.addEventListener("click", () => {
  const file = fileInput.files[0]; // Get the selected file
  handleFile(file);
});
