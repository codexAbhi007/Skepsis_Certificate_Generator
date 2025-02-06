const userName = document.getElementById("name");
const submitBtn = document.getElementById("submitBtn");
const fileInput = document.getElementById("file");

const { PDFDocument, rgb, degrees } = PDFLib;

// const capitalize = (str, lower = false) =>
//   (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) =>
//     match.toUpperCase()
//   );

// submitBtn.addEventListener("click", () => {
//   const val = capitalize(userName.value);

//   //check if the text is empty or not
//   if (val.trim() !== "" && userName.checkValidity()) {
//     // console.log(val);
//     generatePDF(val);
//   } else {
//     userName.reportValidity();
//   }
// });

const generatePDF = async (name, event, year) => {
  const existingPdfBytes = await fetch("./assets/cert.pdf").then((res) =>
    res.arrayBuffer()
  );

  // Load a PDFDocument from the existing PDF bytes
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);

  //get font
  const fontBytes = await fetch("./KaushanScript-Regular.ttf").then((res) =>
    res.arrayBuffer()
  );

  // Embed our custom font in the document
  const KaushanFont = await pdfDoc.embedFont(fontBytes);

  // Get the first page of the document
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // Get the dimensions of the text to be drawn
  const fontSize = 45;
  const textWidth = KaushanFont.widthOfTextAtSize(name, fontSize);
  // const textHeight = KaushanFont.heightAtSize(fontSize); // if further need of height

  // Get page dimensions
  const { width: pageWidth } = firstPage.getSize();

  // Calculate the centered x coordinate
  // The blank space appears to be in the middle of the page
  const centerX = (pageWidth - textWidth) / 2;

  // The y coordinate (330) seems perfect but might need slight adjustment
  const centerY = 330;

  // Draw a string of text diagonally across the first page
  firstPage.drawText(name, {
    x: centerX,
    y: centerY,
    size: fontSize,
    font: KaushanFont,
    color: rgb(0, 0, 0),
  });

  // Serialize the PDFDocument to bytes (a Uint8Array)
  return await pdfDoc.save();
};



fileInput.addEventListener('change', handleFile, false);

//Modified PDF handler
async function handleFile(e) {
  console.log("Hello")
  const file = e.target.files[0];
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
      const pdfBytes = await generatePDF(data.name, data.event,data.pdf);
      zip.file(`${data.name}_${data.event}}.pdf`, pdfBytes);
    }

    zip.generateAsync({ type: "blob" }).then(function(content) {
      saveAs(content, "certificatesZip.zip");
    });
  };
  reader.readAsArrayBuffer(file);
}


