const submitBtn = document.getElementById("submitBtn");
const fileInput = document.getElementById("file");
const errorMsg = document.getElementById("errorMsg");
const loader = document.getElementById("loader");

const { PDFDocument, rgb } = PDFLib;

const generatePDF = async (name) => {
  const existingPdfBytes = await fetch("./assets/participation.pdf").then(
    (res) => res.arrayBuffer()
  );

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await fetch("./LeckerliOne-Regular.ttf").then((res) =>
    res.arrayBuffer()
  );
  const LeckerliOne = await pdfDoc.embedFont(fontBytes);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width: pageWidth } = firstPage.getSize();
  let fontSize = 90;
  let textWidth = LeckerliOne.widthOfTextAtSize(name, fontSize);
  const maxWidth = pageWidth - 50; 

  
  while (textWidth > maxWidth && fontSize > 40) {
    fontSize -= 5;
    textWidth = LeckerliOne.widthOfTextAtSize(name, fontSize);
  }

  let centerY = 270;

  firstPage.drawText(name, {
    x: (pageWidth - textWidth) / 2,
    y: centerY,
    size: fontSize,
    font: LeckerliOne,
    color: rgb(2 / 255, 49 / 255, 106 / 255),
  });

  return await pdfDoc.save();
};

async function handleFile(file) {
  if (!file) {
    errorMsg.textContent = "Please upload a file.";
    errorMsg.style.display = "block";
    return;
  }

  const allowedExtensions = ["xls", "xlsx"];
  const fileExtension = file.name.split(".").pop().toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    errorMsg.textContent = "Only Excel files (.xls, .xlsx) are allowed.";
    errorMsg.style.display = "block";
    return;
  }

  errorMsg.style.display = "none";
  submitBtn.disabled = true;
  loader.style.display = "block";

  const reader = new FileReader();
  reader.onload = async function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet);
    const formattedData = json.map((row) => ({
      name: row.NAME,
    }));

    const zip = new JSZip();
    for (const data of formattedData) {
      const pdfBytes = await generatePDF(data.name);
      zip.file(`${data.name}.pdf`, pdfBytes);
    }

    zip.generateAsync({ type: "blob" }).then(function (content) {
      saveAs(content, "certificatesZip.zip");

      loader.style.display = "none";
      submitBtn.disabled = false;
      alert("File uploaded and processed successfully!");
    });
  };
  reader.readAsArrayBuffer(file);
}

submitBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  handleFile(file);
});
