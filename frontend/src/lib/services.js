export const SERVICE_FEE = 250;

export const SERVICES = {
  scholarship: {
    key: "scholarship",
    name: "Scholarship Application",
    short: "Scholarship",
    description: "Get assistance with completing and preparing your scholarship application.",
    docs: [
      { key: "photograph", label: "Photograph", required: true },
      { key: "student_id", label: "Student ID / Bonafide Certificate", required: true },
      { key: "marksheet", label: "Academic Marksheet", required: true },
      { key: "income_certificate", label: "Income Certificate", required: false },
    ],
    detailFields: [
      { name: "institution", label: "School / College Name", required: true, placeholder: "e.g. St. Xavier's College" },
      { name: "course", label: "Course", required: true, placeholder: "e.g. BCA" },
      { name: "year_semester", label: "Year / Semester", required: true, placeholder: "e.g. 2nd Year / Sem 4" },
      { name: "student_id", label: "Student ID / Roll Number", required: true, placeholder: "e.g. BCA2024-118" },
      { name: "scholarship_name", label: "Scholarship Name / Type", required: true, placeholder: "e.g. Merit-cum-Means Scholarship" },
      { name: "previous_percentage", label: "Last Exam Percentage / CGPA", required: true, placeholder: "e.g. 82%" },
      { name: "account_holder", label: "Bank Account Holder Name", required: true, placeholder: "As per bank records" },
      { name: "account_number", label: "Bank Account Number", required: true, placeholder: "Account number" },
      { name: "ifsc", label: "IFSC Code", required: true, placeholder: "e.g. SBIN0001234" },
    ],
  },
  pan: {
    key: "pan",
    name: "PAN Card Application",
    short: "PAN Card",
    description: "Get assistance with completing your PAN card application and preparing the required information.",
    docs: [
      { key: "identity_proof", label: "Identity Proof", required: true },
      { key: "address_proof", label: "Address Proof", required: true },
      { key: "photograph", label: "Photograph", required: true },
      { key: "dob_proof", label: "Date of Birth Proof", required: false },
    ],
    detailFields: [
      { name: "application_type", label: "Application Type", required: true, type: "select", options: ["New PAN", "Correction / Update"] },
      { name: "father_name", label: "Father's Name", required: true, placeholder: "As per records" },
      { name: "aadhaar_number", label: "Aadhaar Number", required: true, placeholder: "12-digit Aadhaar number", maxLength: 12 },
      { name: "name_on_card", label: "Name to be Printed on Card", required: true, placeholder: "Name as it should appear" },
    ],
  },
  learner: {
    key: "learner",
    name: "Learner's Licence",
    short: "Learner's Licence",
    description: "Get assistance with completing your learner's licence application.",
    docs: [
      { key: "age_proof", label: "Age Proof", required: true },
      { key: "address_proof", label: "Address Proof", required: true },
      { key: "photograph", label: "Photograph", required: true },
      { key: "medical_certificate", label: "Medical Certificate (Form 1A)", required: false },
    ],
    detailFields: [
      { name: "vehicle_category", label: "Vehicle Category", required: true, type: "select", options: ["MCWOG (Without Gear)", "MCWG (With Gear)", "LMV (Car / Light Motor Vehicle)", "MCWG + LMV"] },
      { name: "blood_group", label: "Blood Group", required: false, type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
      { name: "rto_city", label: "RTO City / Jurisdiction", required: true, placeholder: "e.g. Bengaluru South" },
      { name: "qualification", label: "Educational Qualification", required: true, placeholder: "e.g. 12th Pass" },
    ],
  },
};

export const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Application Submitted",
  documents_under_review: "Documents Under Review",
  processing: "Processing",
  need_more_info: "Need More Information",
  completed: "Completed",
};

export const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-50 text-blue-700",
  documents_under_review: "bg-amber-50 text-amber-700",
  processing: "bg-indigo-50 text-indigo-700",
  need_more_info: "bg-orange-50 text-orange-700",
  completed: "bg-emerald-50 text-emerald-700",
};

export const TRACK_STEPS = [
  { key: "submitted", label: "Application Submitted" },
  { key: "payment", label: "Payment Confirmed" },
  { key: "documents", label: "Documents Received" },
  { key: "processing", label: "Application Processing" },
  { key: "completed", label: "Completed" },
];

export function trackProgress(status, paymentStatus) {
  const order = ["submitted", "documents_under_review", "processing", "completed"];
  const idx = order.indexOf(status);
  return {
    submitted: status !== "draft",
    payment: paymentStatus === "paid",
    documents: idx >= 1 || status === "need_more_info",
    processing: idx >= 2,
    completed: status === "completed",
  };
}
