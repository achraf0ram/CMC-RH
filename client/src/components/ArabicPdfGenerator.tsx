import React from "react";
import { jsPDF } from "jspdf";
import { AmiriFont } from "../fonts/AmiriFont";

const ArabicPdfGenerator: React.FC = () => {
  const generatePdf = () => {
    const doc = new jsPDF();

    // دمج الخط
    doc.addFileToVFS("Amiri.ttf", AmiriFont.data);
    doc.addFont("Amiri.ttf", "Amiri", "normal");
    doc.setFont("Amiri");

    doc.setFontSize(18);
    doc.text("مرحبًا بك في نظام الموارد البشرية", 190, 30, {
      align: "right",
    });

    doc.save("arabic-output.pdf");
  };

  return (
    <div className="p-4">
      <button
        onClick={generatePdf}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        توليد PDF عربي
      </button>
    </div>
  );
};

export default ArabicPdfGenerator;
