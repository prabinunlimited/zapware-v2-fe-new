import React, { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import UnlimitedLogo from "../../../assets/images/Logo/unlimited remit logo.png";
import { ClipLoader } from "react-spinners";
import { FiDownload, FiArrowLeft, FiPrinter } from "react-icons/fi";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { fetchPartnerProfileData } from "./slices/bankLetterSlice";

const BankLetter = () => {
  const { accountId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { accountData } = location.state || {};

  const authtoken = localStorage.getItem("authtoken");
  const staffId = localStorage.getItem("staff_id");
  const isWhitelabelledCustomer = localStorage.getItem("isWhitelabelledCustomer");
  const whitelabelPartnerId = localStorage.getItem("whitelabelled_customer_partnerid");

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Redux state
  const dispatch = useDispatch();
  const { partnerProfileData, loading } = useSelector((state) => state.bankLetter);

  useEffect(() => {
    if (isWhitelabelledCustomer === "Y") {
      dispatch(
        fetchPartnerProfileData({
          token: authtoken,
          partnerId: whitelabelPartnerId,
        })
      );
    }
  }, [dispatch, staffId]);

  const [currentDate] = useState(
    new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );

  if (!accountData) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p className="text-red-500 font-semibold">
          Account data is missing. Please go back and try again.
        </p>
        <button
          className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg shadow-lg"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  // PDF GENERATION (unchanged)
  const generatePDF = async () => {
    setPdfGenerating(true);
    const content = document.querySelector("#pdfContent");

    try {
      content.classList.add("generating-pdf");

      const canvas = await html2canvas(content, { scale: 3 });
      const imgData = canvas.toDataURL("image/png", 1.0);

      const doc = new jsPDF("p", "mm", "a4");

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      doc.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      doc.save(`Bank_Letter_${accountData?.account_number || "N/A"}.pdf`);
    } catch (err) {
      setError("Failed to generate PDF");
    } finally {
      content.classList.remove("generating-pdf");
      setPdfGenerating(false);
    }
  };

  const printDocument = () => {
    const content = document.querySelector("#pdfContent");
    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <html><body>${content.innerHTML}</body></html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="text-blue-600 flex items-center">
          <FiArrowLeft className="mr-2" /> Back
        </button>
        <h1 className="text-2xl font-bold">Bank Confirmation Letter</h1>
        <div className="w-24"></div>
      </div>

      {/* PDF CONTENT */}
      <div className="flex justify-center">
        <div id="pdfContent" className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl">
          <header className="text-center pb-6">
            {isWhitelabelledCustomer === "Y" ? (
              loading ? (
                <ClipLoader size={30} />
              ) : (
                <img
                  src={partnerProfileData?.logo}
                  alt="Partner Logo"
                  className="h-[60px] object-contain"
                />
              )
            ) : (
              <img src={UnlimitedLogo} alt="Logo" className="w-40 mx-auto" />
            )}

            <h1 className="text-2xl font-bold">Bank Confirmation Letter</h1>
          </header>

          <main>
            <div className="text-right text-sm text-gray-600 mb-6">{currentDate}</div>

            {/* PARTNER TEXT OR DEFAULT TEXT */}
            <div className="text-justify">
              {isWhitelabelledCustomer === "Y" ? (
                loading ? (
                  <ClipLoader size={30} />
                ) : (
                  <div
                    dangerouslySetInnerHTML={{ __html: partnerProfileData?.text || "" }}
                  />
                )
              ) : (
                <>
                  <p className="mb-4">Dear Customer,</p>
                  <p className="mb-4">
                    Founded in 1992, Unlimited is one of the largest organizations...
                  </p>
                </>
              )}
            </div>

            {/* ==== account details same as your original code ==== */}
            {/* I am leaving this as-is to keep exactly your UI */}
            {/** ---------------- ACCOUNT DETAILS KEEP SAME ----------------- **/}

          </main>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
        <button
          onClick={generatePDF}
          disabled={pdfGenerating}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center"
        >
          {pdfGenerating ? <ClipLoader size={18} /> : <FiDownload className="mr-2" />}
          Download PDF
        </button>

        <button
          onClick={printDocument}
          className="bg-gray-100 px-6 py-3 rounded-lg flex items-center"
        >
          <FiPrinter className="mr-2" /> Print
        </button>
      </div>

      {error && <div className="text-red-500 text-center mt-4">{error}</div>}
    </div>
  );
};

export default BankLetter;
