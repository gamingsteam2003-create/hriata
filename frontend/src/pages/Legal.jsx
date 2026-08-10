import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const CONTENT = {
  privacy: {
    title: "Privacy Policy",
    testid: "privacy-page",
    sections: [
      ["What we collect", "We collect the information you provide while creating an account and submitting an application: your name, contact details, application-related information and the documents you upload. We collect only what is required for the assistance workflow you choose."],
      ["How we use it", "Your information is used solely to provide application assistance, process your service fee, communicate status updates and respond to your requests. We do not sell your personal information."],
      ["Document security", "Uploaded documents are stored securely and are accessible only to you and authorized FormEase staff through authenticated, private URLs. Documents are never publicly listed or exposed."],
      ["Payments", "Payments are processed by our payment gateway partner. FormEase never stores your card, UPI or banking credentials. Only the payment reference IDs and status are recorded."],
      ["Your rights", "You may request access, correction or deletion of your account data by contacting us. Application records may be retained where required for accounting and legal compliance."],
      ["Contact", "For privacy questions, reach us through the contact details listed on our Contact section."],
    ],
  },
  terms: {
    title: "Terms & Conditions",
    testid: "terms-page",
    sections: [
      ["Nature of service", "FormEase is an independent application assistance service. We help customers complete and prepare Scholarship, PAN Card and Learner's Licence applications. FormEase is not a government website, government authority, or an official partner of the Income Tax Department, Parivahan, any state government or any scholarship authority. We do not issue PAN cards, licences, scholarships or certificates."],
      ["Service fee", "Each application assistance service is charged at a fixed assistance fee — ₹100 for Scholarship and PAN Card, ₹350 for Learner's Licence — payable before submission. The fee covers assistance with completing and preparing your application only."],
      ["Customer responsibilities", "You are responsible for providing accurate information and genuine documents. Submitting false information or forged documents may result in rejection of your application and termination of service without refund."],
      ["Outcomes", "Approval or rejection of any application rests solely with the respective authority. FormEase does not guarantee approval, timelines or outcomes of any application."],
      ["Acceptable use", "You agree not to misuse the platform, attempt unauthorized access, or upload malicious files. Accounts involved in abuse may be suspended."],
      ["Changes", "These terms may be updated from time to time. Continued use of the platform constitutes acceptance of the updated terms."],
    ],
  },
  refund: {
    title: "Refund Policy",
    testid: "refund-page",
    sections: [
      ["Before processing begins", "If your application has not yet entered processing, you may request a refund of the assistance fee by contacting us with your Application ID."],
      ["After processing begins", "Once our team has begun reviewing or processing your application, the assistance fee becomes non-refundable, as the service has been rendered."],
      ["Failed or duplicate payments", "If a payment was debited but not confirmed, or you were charged more than once for the same application, the full duplicate/failed amount will be refunded to the original payment method within 5–7 business days after verification."],
      ["How to request", "Contact us via phone, email or WhatsApp listed in the Contact section, quoting your Application ID and payment reference."],
    ],
  },
};

export default function Legal({ type }) {
  const page = CONTENT[type] || CONTENT.privacy;
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32 pb-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto" data-testid={page.testid}>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">{page.title}</h1>
          <p className="mt-3 text-sm text-slate-400">Last updated: June 2026</p>
          <div className="mt-10 space-y-8">
            {page.sections.map(([h, t]) => (
              <section key={h}>
                <h2 className="text-xl font-medium text-slate-900 mb-2.5">{h}</h2>
                <p className="text-sm leading-relaxed text-slate-600">{t}</p>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
