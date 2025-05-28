import React from "react";
import jsPDF from "jspdf";
import { AmiriFont } from "../fonts/AmiriFont";
// @ts-ignore
import * as reshaper from "arabic-persian-reshaper";
const reshape = reshaper.reshape;
// أو قد يكون reshaper.default.reshape اعتمادًا على المكتبة
import bidi from "bidi-js";

const ArabicPdfGenerator: React.FC = () => {
  const generatePdf = () => {
    const doc = new jsPDF();

    // أضف الخط إلى jsPDF
    doc.addFileToVFS("Amiri-Regular.ttf", AmiriFont);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri");
    doc.setFontSize(16);

    // نص عربي (يمكنك عكسه أو استخدام مكتبة bidi-js/reshaper)
    const arabicText = "طلب إجازة";
    const shaped = reshape(arabicText);
    const bidiText = bidi.from_string(shaped).toString();
    doc.text(bidiText, 180, 30, { align: "right" });

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
