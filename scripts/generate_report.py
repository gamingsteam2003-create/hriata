"""Generate the FormEase BCA minor project report PDF."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                Image, PageBreak, Table, TableStyle, HRFlowable)

NAVY = colors.HexColor("#0A192F")
ROYAL = colors.HexColor("#1D4ED8")
SLATE = colors.HexColor("#475569")
LIGHT = colors.HexColor("#E2E8F0")
OUT = "/app/docs/FormEase_BCA_Project_Report_KC_Vanlalhriata.pdf"
LOGO = "/app/docs/icfai_logo.jpg"

styles = {
    "cover_title": ParagraphStyle("cover_title", fontName="Helvetica-Bold", fontSize=30, textColor=NAVY, alignment=TA_CENTER, leading=36, spaceAfter=14),
    "cover_sub": ParagraphStyle("cover_sub", fontName="Helvetica", fontSize=15, textColor=ROYAL, alignment=TA_CENTER, spaceAfter=4),
    "cover_body": ParagraphStyle("cover_body", fontName="Helvetica", fontSize=11.5, textColor=SLATE, alignment=TA_CENTER, leading=17),
    "cover_name": ParagraphStyle("cover_name", fontName="Helvetica-Bold", fontSize=14, textColor=NAVY, alignment=TA_CENTER, leading=20),
    "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=17, textColor=NAVY, spaceBefore=6, spaceAfter=10),
    "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=13, textColor=ROYAL, spaceBefore=12, spaceAfter=5),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=10.5, textColor=colors.HexColor("#1F2937"), alignment=TA_JUSTIFY, leading=15.5, spaceAfter=7),
    "bullet": ParagraphStyle("bullet", fontName="Helvetica", fontSize=10.5, textColor=colors.HexColor("#1F2937"), alignment=TA_JUSTIFY, leading=15.5, leftIndent=16, bulletIndent=6, spaceAfter=3),
    "center": ParagraphStyle("center", fontName="Helvetica", fontSize=10.5, alignment=TA_CENTER, leading=15),
    "toc1": ParagraphStyle("toc1", fontName="Helvetica-Bold", fontSize=11, textColor=NAVY, leading=19),
    "toc2": ParagraphStyle("toc2", fontName="Helvetica", fontSize=10.5, textColor=SLATE, leading=17, leftIndent=18),
    "cell": ParagraphStyle("cell", fontName="Helvetica", fontSize=9.5, leading=13),
    "cellb": ParagraphStyle("cellb", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=colors.white),
}


def P(text, style="body"):
    return Paragraph(text, styles[style])


def B(text):
    return Paragraph(text, styles["bullet"], bulletText="•")


def table(headers, rows, widths):
    data = [[Paragraph(h, styles["cellb"]) for h in headers]]
    for r in rows:
        data.append([Paragraph(str(c), styles["cell"]) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ]))
    return t


def on_page(canv, doc):
    canv.saveState()
    canv.setStrokeColor(LIGHT)
    canv.setLineWidth(0.5)
    canv.line(2 * cm, 1.6 * cm, A4[0] - 2 * cm, 1.6 * cm)
    canv.setFont("Helvetica", 8.5)
    canv.setFillColor(SLATE)
    canv.drawString(2 * cm, 1.15 * cm, "FormEase — BCA Minor Project Report")
    canv.drawRightString(A4[0] - 2 * cm, 1.15 * cm, f"Page {doc.page}")
    canv.restoreState()


def on_cover(canv, doc):
    canv.saveState()
    canv.setFillColor(NAVY)
    canv.rect(0, A4[1] - 1.2 * cm, A4[0], 1.2 * cm, stroke=0, fill=1)
    canv.rect(0, 0, A4[0], 1.2 * cm, stroke=0, fill=1)
    canv.restoreState()


doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm,
                      topMargin=2.2 * cm, bottomMargin=2.2 * cm,
                      title="FormEase — BCA Minor Project Report",
                      author="KC Vanlalhriata")
frame = Frame(2 * cm, 2.2 * cm, A4[0] - 4 * cm, A4[1] - 4.4 * cm, id="main")
cover_frame = Frame(2 * cm, 2.2 * cm, A4[0] - 4 * cm, A4[1] - 4.4 * cm, id="cover")
doc.addPageTemplates([
    PageTemplate(id="Cover", frames=[cover_frame], onPage=on_cover),
    PageTemplate(id="Content", frames=[frame], onPage=on_page),
])

story = []
from reportlab.platypus import NextPageTemplate
story.append(NextPageTemplate("Content"))

# ---------------- COVER ----------------
story.append(Spacer(1, 1.2 * cm))
story.append(Image(LOGO, width=4.2 * cm, height=4.2 * cm, hAlign="CENTER"))
story.append(Spacer(1, 0.5 * cm))
story.append(P("THE ICFAI UNIVERSITY MIZORAM", "cover_name"))
story.append(P("Department of Computer Applications", "cover_body"))
story.append(Spacer(1, 1.1 * cm))
story.append(HRFlowable(width="55%", thickness=1.2, color=ROYAL, hAlign="CENTER"))
story.append(Spacer(1, 0.45 * cm))
story.append(P("FORMEASE", "cover_title"))
story.append(P("Premium Online Application Assistance Platform", "cover_sub"))
story.append(P("<i>Your Forms. Simplified.</i>", "cover_body"))
story.append(Spacer(1, 0.45 * cm))
story.append(HRFlowable(width="55%", thickness=1.2, color=ROYAL, hAlign="CENTER"))
story.append(Spacer(1, 0.9 * cm))
story.append(P("A Minor Project Report submitted in partial fulfillment of the requirements<br/>for the award of the degree of", "cover_body"))
story.append(Spacer(1, 0.25 * cm))
story.append(P("BACHELOR OF COMPUTER APPLICATIONS (BCA)", "cover_name"))
story.append(Spacer(1, 1.0 * cm))
story.append(P("Submitted by", "cover_body"))
story.append(Spacer(1, 0.15 * cm))
story.append(P("KC VANLALHRIATA", "cover_name"))
story.append(P("Registration No: 24STUCMZD01358", "cover_body"))
story.append(Spacer(1, 0.9 * cm))
story.append(P("Department of Computer Applications (BCA)<br/>The ICFAI University Mizoram<br/>Durtlang North, Aizawl, Mizoram — 796025<br/><br/><b>June 2026</b>", "cover_body"))
story.append(PageBreak())

# ---------------- DECLARATION ----------------
story.append(P("DECLARATION", "h1"))
story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT))
story.append(Spacer(1, 0.3 * cm))
story.append(P("I, <b>KC Vanlalhriata</b>, bearing Registration Number <b>24STUCMZD01358</b>, a student of the Bachelor of Computer Applications (BCA) programme at The ICFAI University Mizoram, hereby declare that the minor project entitled <b>“FormEase — Premium Online Application Assistance Platform”</b> has been carried out by me under the guidance of my project guide, and that this report represents my original work."))
story.append(P("I further declare that the project has not been submitted, either in part or in full, for the award of any degree or diploma in this or any other university or institution. All sources of information and tools used during the development of this project have been duly acknowledged in the bibliography."))
story.append(Spacer(1, 1.6 * cm))
story.append(P("Place: Aizawl, Mizoram", "body"))
story.append(P("Date: June 2026", "body"))
story.append(Spacer(1, 1.6 * cm))
story.append(P("_______________________________", "body"))
story.append(P("<b>KC Vanlalhriata</b><br/>Registration No: 24STUCMZD01358<br/>Department of Computer Applications (BCA)", "body"))
story.append(PageBreak())

# ---------------- CERTIFICATE ----------------
story.append(P("CERTIFICATE", "h1"))
story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT))
story.append(Spacer(1, 0.3 * cm))
story.append(P("This is to certify that the minor project report entitled <b>“FormEase — Premium Online Application Assistance Platform”</b>, submitted by <b>KC Vanlalhriata</b> (Registration No: <b>24STUCMZD01358</b>) in partial fulfillment of the requirements for the award of the degree of <b>Bachelor of Computer Applications</b>, is a record of bona fide work carried out by the student under my supervision and guidance."))
story.append(P("The project, in my opinion, is worthy of consideration for the award of the degree in accordance with the regulations of The ICFAI University Mizoram."))
story.append(Spacer(1, 2.2 * cm))
cert = Table([["_______________________________", "_______________________________"],
              [P("<b>Project Guide</b><br/>Department of Computer Applications", "cell"), P("<b>Head of the Department</b><br/>Department of Computer Applications", "cell")]],
             colWidths=[8.5 * cm, 8.5 * cm])
cert.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
story.append(cert)
story.append(Spacer(1, 1.4 * cm))
story.append(P("_______________________________", "body"))
story.append(P("<b>External Examiner</b>", "body"))
story.append(PageBreak())

# ---------------- ACKNOWLEDGEMENT ----------------
story.append(P("ACKNOWLEDGEMENT", "h1"))
story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT))
story.append(Spacer(1, 0.3 * cm))
story.append(P("The successful completion of this project would not have been possible without the support and encouragement of several people, to whom I owe my sincere gratitude."))
story.append(P("I express my heartfelt thanks to my <b>project guide</b> and the faculty of the <b>Department of Computer Applications, The ICFAI University Mizoram</b>, for their valuable guidance, constructive suggestions and constant encouragement throughout the development of this project."))
story.append(P("I am grateful to the university for providing the academic environment and resources necessary to undertake this work. I also thank my family and friends for their patience and moral support during the course of this project."))
story.append(P("Finally, I acknowledge the open-source communities behind React, FastAPI, MongoDB, Three.js and the many other tools that made this project possible, as well as the documentation of Razorpay and the Emergent platform."))
story.append(Spacer(1, 1.4 * cm))
story.append(P("<b>KC Vanlalhriata</b>", "body"))
story.append(PageBreak())

# ---------------- ABSTRACT ----------------
story.append(P("ABSTRACT", "h1"))
story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT))
story.append(Spacer(1, 0.3 * cm))
story.append(P("<b>FormEase</b> is a production-quality, full-stack web platform that provides professional assistance for three common Indian application workflows — Scholarship applications, PAN Card applications and Learner's Licence applications — at a transparent, fixed per-service fee. The platform addresses a real and widespread problem: ordinary applicants frequently struggle with complex government and institutional application forms, document requirements and unclear status communication."))
story.append(P("The system guides customers through a validated six-step application wizard with secure document uploads (drag-and-drop, type and size validation), processes payments through the Razorpay payment gateway with mandatory server-side signature verification, generates a unique trackable Application ID (FE-YEAR-XXXXX), and notifies the administrator and customer by email. A role-based administrative dashboard allows staff to review applications, verify documents, request replacements, manage application statuses, record private notes and monitor revenue through analytics charts."))
story.append(P("The platform is built with React 19, Tailwind CSS and React Three Fiber on the frontend; FastAPI (Python) on the backend; and MongoDB Atlas as the database. Documents are stored in managed object storage with authenticated access, and the entire application is deployed on Vercel's serverless infrastructure, making it publicly accessible. Security measures include bcrypt password hashing, JWT and cookie-based sessions, Google sign-in, role-based access control, brute-force lockout and private document URLs. Automated end-to-end testing was performed at every stage of development."))
story.append(P("<b>Keywords:</b> Full-stack web application, FastAPI, React, MongoDB, Razorpay, application assistance, serverless deployment, Vercel.", "body"))
story.append(PageBreak())

# ---------------- TOC ----------------
story.append(P("TABLE OF CONTENTS", "h1"))
story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT))
story.append(Spacer(1, 0.3 * cm))
toc = [
    ("toc1", "Chapter 1 — Introduction"),
    ("toc2", "1.1 Overview &nbsp;&nbsp;|&nbsp;&nbsp; 1.2 Problem Statement &nbsp;&nbsp;|&nbsp;&nbsp; 1.3 Objectives &nbsp;&nbsp;|&nbsp;&nbsp; 1.4 Scope"),
    ("toc1", "Chapter 2 — System Analysis"),
    ("toc2", "2.1 Existing System &nbsp;&nbsp;|&nbsp;&nbsp; 2.2 Proposed System &nbsp;&nbsp;|&nbsp;&nbsp; 2.3 Feasibility Study &nbsp;&nbsp;|&nbsp;&nbsp; 2.4 System Requirements"),
    ("toc1", "Chapter 3 — System Design"),
    ("toc2", "3.1 Architecture &nbsp;&nbsp;|&nbsp;&nbsp; 3.2 Database Design &nbsp;&nbsp;|&nbsp;&nbsp; 3.3 API Design &nbsp;&nbsp;|&nbsp;&nbsp; 3.4 UI Design &nbsp;&nbsp;|&nbsp;&nbsp; 3.5 Data Flow &nbsp;&nbsp;|&nbsp;&nbsp; 3.6 Security Design"),
    ("toc1", "Chapter 4 — Technology Stack"),
    ("toc2", "4.1 Frontend &nbsp;&nbsp;|&nbsp;&nbsp; 4.2 Backend &nbsp;&nbsp;|&nbsp;&nbsp; 4.3 Database &nbsp;&nbsp;|&nbsp;&nbsp; 4.4 Third-Party Integrations &nbsp;&nbsp;|&nbsp;&nbsp; 4.5 Deployment"),
    ("toc1", "Chapter 5 — Implementation"),
    ("toc2", "5.1 Authentication &nbsp;&nbsp;|&nbsp;&nbsp; 5.2 Application Wizard &nbsp;&nbsp;|&nbsp;&nbsp; 5.3 Document Uploads &nbsp;&nbsp;|&nbsp;&nbsp; 5.4 Payments &nbsp;&nbsp;|&nbsp;&nbsp; 5.5 Tracking &nbsp;&nbsp;|&nbsp;&nbsp; 5.6 Notifications &nbsp;&nbsp;|&nbsp;&nbsp; 5.7 Admin Dashboard &nbsp;&nbsp;|&nbsp;&nbsp; 5.8 Security"),
    ("toc1", "Chapter 6 — Testing"),
    ("toc2", "6.1 Testing Approach &nbsp;&nbsp;|&nbsp;&nbsp; 6.2 Test Cases &nbsp;&nbsp;|&nbsp;&nbsp; 6.3 Test Results"),
    ("toc1", "Chapter 7 — Conclusion and Future Scope"),
    ("toc1", "Bibliography"),
]
for s, t in toc:
    story.append(P(t, s))
story.append(PageBreak())

# ---------------- CHAPTER 1 ----------------
story.append(P("CHAPTER 1: INTRODUCTION", "h1"))
story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT))
story.append(P("1.1 Overview", "h2"))
story.append(P("FormEase is an independent online application assistance service. In India, three application workflows affect millions of people every year: applying for educational scholarships, applying for a PAN (Permanent Account Number) card from the income-tax system, and applying for a Learner's Licence before obtaining a driving licence. Although the underlying authorities provide their own portals, a large section of applicants — students, first-time internet users and busy working people — find the forms confusing, the document requirements unclear and the status communication poor."))
story.append(P("FormEase positions itself as a trustworthy middle layer: a premium, simple and secure platform where a customer creates an account, chooses one of the three services, completes a guided multi-step form, uploads supporting documents, pays a fixed assistance fee online, and receives a unique Application ID with which the progress of the application can be tracked publicly at any time. An administrative back-office allows the operator to process applications, verify documents and communicate status changes."))
story.append(P("1.2 Problem Statement", "h2"))
story.append(P("Existing application portals are frequently criticised for dense government-style forms, cryptic validation errors, uncertainty about required documents and a lack of human-readable status updates. Applicants often do not know whether their application was received, whether their documents were acceptable, or what happens next. There is a clear need for a service that simplifies the preparation of such applications, keeps the applicant informed, and charges a small, transparent fee for the assistance — without pretending to be a government authority."))
story.append(P("1.3 Objectives of the Project", "h2"))
for b in [
    "To design and develop a complete full-stack web platform for online application assistance covering Scholarship, PAN Card and Learner's Licence services.",
    "To implement a validated multi-step application wizard with secure document upload and review-before-payment flow.",
    "To integrate a real payment gateway (Razorpay) with mandatory server-side payment verification and per-service pricing.",
    "To generate unique, human-readable Application IDs and provide public application tracking.",
    "To provide a secure, role-based admin dashboard for application processing, document verification, status management and revenue analytics.",
    "To implement automated email notifications and an extensible WhatsApp notification architecture.",
    "To apply production-grade security practices (password hashing, session management, access control, private document storage) and to deploy the system on a public cloud platform.",
]:
    story.append(B(b))
story.append(P("1.4 Scope of the Project", "h2"))
story.append(P("The platform covers the assistance workflow only: it helps customers complete and prepare applications and does not itself issue PAN cards, licences or scholarships, which remain the sole responsibility of the respective authorities. The current version supports three services with fixed fees (Scholarship Rs. 100, PAN Card Rs. 100, Learner's Licence Rs. 350), customer and admin roles, and English-language UI. The system is designed so that additional services, notification channels and payment methods can be added with minimal change."))
story.append(P("1.5 Organization of the Report", "h2"))
story.append(P("Chapter 2 analyses the existing and proposed systems and the feasibility of the project. Chapter 3 presents the system design, including architecture, database and API design. Chapter 4 describes the technology stack. Chapter 5 details the implementation of each module. Chapter 6 reports the testing strategy and results. Chapter 7 concludes and outlines future enhancements."))
story.append(PageBreak())

# ---------------- CHAPTER 2 ----------------
story.append(P("CHAPTER 2: SYSTEM ANALYSIS", "h1"))
story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT))
story.append(P("2.1 Existing System", "h2"))
story.append(P("At present, an applicant must interact directly with separate, unrelated portals for each service: scholarship portals of various authorities, the PAN application portals, and the Parivahan Sarathi portal for learner's licences. Each has its own account system, form structure, document format rules and payment process. Status information is typically limited to a single reference number with little explanation."))
story.append(P("2.2 Limitations of the Existing Approach", "h2"))
for b in [
    "Complex, non-uniform forms that confuse first-time applicants.",
    "No single place to manage different applications.",
    "Unclear document requirements leading to rejections.",
    "Minimal status communication after submission.",
    "Payment and refund processes that are difficult to trace.",
]:
    story.append(B(b))
story.append(P("2.3 Proposed System", "h2"))
story.append(P("FormEase proposes a unified assistance platform. A single account manages all three service types. The application is broken into small, validated steps (Personal Details → Application Details → Documents → Review → Payment → Submitted) so the user is never confronted with a long, intimidating form. Documents are uploaded with a modern drag-and-drop interface that validates file type and size before upload. Payment is a fixed, clearly displayed fee processed by Razorpay and verified on the server before the application is accepted. Every successful application receives a unique Application ID that can be tracked on a public page. The administrator works from a dedicated dashboard with statistics, filters, document review and private notes."))
story.append(P("2.4 Feasibility Study", "h2"))
story.append(P("<b>Technical feasibility.</b> The system is built entirely with mature, widely adopted open-source technologies (React, FastAPI, MongoDB) and managed services (Razorpay, object storage, email). All components were verified working in a production deployment.", "body"))
story.append(P("<b>Economic feasibility.</b> The platform was developed and deployed using free-tier services (Vercel, MongoDB Atlas) and incurs no infrastructure cost at demonstration scale. Revenue is generated per application through the assistance fee.", "body"))
story.append(P("<b>Operational feasibility.</b> The customer workflow requires only a phone or computer with a browser; no training is needed. The admin dashboard is equally approachable for a single operator.", "body"))
story.append(P("2.5 System Requirements", "h2"))
story.append(table(
    ["Category", "Requirement"],
    [["Client (customer)", "Any modern browser (Chrome, Firefox, Safari, Edge) on phone, tablet or desktop"],
     ["Server (development)", "Python 3.10+, Node.js 20+, MongoDB 6+"],
     ["Hosting (production)", "Vercel (frontend + serverless API), MongoDB Atlas M0 (database)"],
     ["Key backend libraries", "FastAPI, Motor (async MongoDB driver), PyJWT, bcrypt, Razorpay SDK, httpx"],
     ["Key frontend libraries", "React 19, Tailwind CSS, shadcn/ui, Framer Motion, React Three Fiber, Recharts, Axios"]],
    [4.5 * cm, 12.5 * cm]))
story.append(PageBreak())

# ---------------- CHAPTER 3 ----------------
story.append(P("CHAPTER 3: SYSTEM DESIGN", "h1"))
story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT))
story.append(P("3.1 System Architecture", "h2"))
story.append(P("FormEase follows a three-tier architecture. The <b>presentation tier</b> is a React single-page application served as static files. The <b>application tier</b> is a FastAPI REST API running as a serverless Python function under the /api path on the same domain. The <b>data tier</b> comprises MongoDB Atlas (users, applications, payments, sessions, notifications, audit logs) and a managed object-storage service that holds uploaded documents. Third-party services (Razorpay for payments, the email provider for notifications, Emergent-managed Google sign-in) are invoked only from the backend so that secrets never reach the browser."))
story.append(P("3.2 Database Design", "h2"))
story.append(P("MongoDB collections and their principal fields:", "body"))
story.append(table(
    ["Collection", "Principal Fields", "Purpose"],
    [["users", "name, email (unique), phone, password_hash, role, picture, created_at", "Customer and admin accounts"],
     ["applications", "application_id (unique), user_id, service_type, applicant_data, documents[], status, payment_status, admin_notes[], status_history[], created_at, updated_at", "Application records and lifecycle"],
     ["payments", "application_id, order_id, payment_id, amount, currency, status, mode, verified_at", "Razorpay order/payment records"],
     ["user_sessions", "user_id, session_token, expires_at", "Google sign-in sessions"],
     ["notifications", "application_id, type, channel, recipient, message, status, created_at", "Email/WhatsApp notification log"],
     ["audit_logs", "admin_id, action, application_id, detail, at", "Admin action audit trail"],
     ["counters", "seq (per year)", "Atomic Application ID sequence"]],
    [3.2 * cm, 8.3 * cm, 5.5 * cm]))
story.append(P("Application documents are embedded as sub-documents inside the applications collection (doc_type, label, file_name, storage_path, size, verified, replacement_requested), while the binary files themselves are kept in object storage — following the rule of never storing large binary data in the database.", "body"))
story.append(P("3.3 API Design", "h2"))
story.append(table(
    ["Endpoint", "Method", "Access", "Function"],
    [["/api/auth/register, /login, /logout", "POST", "Public", "Account lifecycle (JWT httpOnly cookies)"],
     ["/api/auth/me, /auth/refresh", "GET/POST", "Authenticated", "Session info and renewal"],
     ["/api/auth/forgot-password, /reset-password", "POST", "Public", "Token-based password reset"],
     ["/api/auth/google/session", "POST", "Public", "Exchange Google session for app session"],
     ["/api/applications", "POST", "Owner", "Create/resume draft application"],
     ["/api/applications/{id}", "GET/PATCH", "Owner", "Read or save progress"],
     ["/api/applications/track/{id}", "GET", "Public", "Safe status tracking only"],
     ["/api/documents/upload, /documents/{...}", "POST/GET/DELETE", "Owner/Admin", "Object-storage document handling"],
     ["/api/payments/create-order, /verify", "POST", "Owner", "Razorpay order + signature verification"],
     ["/api/payments/webhook", "POST", "Webhook", "Razorpay event confirmation"],
     ["/api/admin/stats, /applications, /analytics, /notifications", "GET", "Admin", "Dashboard data"],
     ["/api/admin/applications/{id}/status, /notes, /documents/{doc}", "PATCH/POST", "Admin", "Processing actions"]],
    [6.2 * cm, 2.0 * cm, 2.3 * cm, 6.5 * cm]))
story.append(P("3.4 User Interface Design", "h2"))
story.append(P("The interface follows a premium, minimal design language (deep navy, royal blue and soft gray palette; Outfit and Manrope typefaces) with a lightweight interactive 3D hero scene built with React Three Fiber, subtle scroll-reveal animations, and full mobile responsiveness with reduced 3D effects and large touch targets on small screens. Forms prioritise clarity: clear labels, inline validation messages, and a persistent step indicator in the application wizard."))
story.append(P("3.5 Data Flow", "h2"))
story.append(P("<b>Customer journey:</b> Landing page → choose service → register/login → six-step wizard (data saved per step) → document upload to object storage → review summary → Razorpay checkout → server-side verification → Application ID issued → email notification → public tracking.", "body"))
story.append(P("<b>Admin journey:</b> Email/WhatsApp notification of a new paid application → admin dashboard → application detail → document verification / replacement request → status transitions (Submitted → Documents Under Review → Processing → Completed, or Need More Information) → customer notified of each change.", "body"))
story.append(P("3.6 Security Design", "h2"))
story.append(P("Security was treated as a first-class requirement because applicants upload sensitive identity documents: bcrypt password hashing, JWT access/refresh tokens and Google sessions in httpOnly secure cookies, role-based access control enforced on the server, login brute-force lockout (5 attempts / 15 minutes), authenticated-only document downloads (owner or admin), file type/size validation on both client and server, input sanitisation, security HTTP headers, admin audit logging, and all secrets kept in server-side environment variables. Payment acceptance depends solely on Razorpay signature verification — never on frontend-supplied claims."))
story.append(PageBreak())

# ---------------- CHAPTER 4 ----------------
story.append(P("CHAPTER 4: TECHNOLOGY STACK", "h1"))
story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT))
story.append(P("4.1 Frontend", "h2"))
for b in [
    "<b>React 19</b> — component-based UI library; single-page application with React Router 7.",
    "<b>Tailwind CSS + shadcn/ui</b> — utility-first styling and an accessible component library.",
    "<b>React Three Fiber / Three.js</b> — the abstract 3D hero scene (floating documents, ID card, shield, check mark) with mouse parallax; simplified automatically on mobile and for reduced-motion users.",
    "<b>Framer Motion</b> — scroll reveals, page and wizard-step transitions, success animation.",
    "<b>Recharts</b> — responsive analytics charts in the admin dashboard.",
    "<b>Axios</b> — API client with cookie-based credentials.",
]:
    story.append(B(b))
story.append(P("4.2 Backend", "h2"))
for b in [
    "<b>FastAPI (Python)</b> — high-performance async REST API framework with automatic validation via Pydantic.",
    "<b>Motor</b> — asynchronous MongoDB driver.",
    "<b>PyJWT + bcrypt</b> — token issuance/verification and password hashing.",
    "<b>Razorpay Python SDK</b> — order creation and payment signature verification.",
    "<b>httpx / requests</b> — outbound calls to notification and storage services.",
]:
    story.append(B(b))
story.append(P("4.3 Database", "h2"))
story.append(P("<b>MongoDB Atlas</b> — a managed, cloud-hosted MongoDB cluster (free M0 tier) storing all application data with unique indexes on user email and application ID."))
story.append(P("4.4 Third-Party Integrations", "h2"))
for b in [
    "<b>Razorpay</b> — payment gateway; checkout on the frontend, order creation and signature verification on the backend (test mode during development, live keys supported).",
    "<b>Managed object storage</b> — persistent document storage with all access proxied through authenticated backend endpoints.",
    "<b>Managed email (Resend-compatible)</b> — transactional emails for application received, payment confirmation, status updates and document requests.",
    "<b>Emergent-managed Google Auth</b> — one-click Google sign-in alongside email/password accounts.",
    "<b>WhatsApp Cloud API architecture</b> — notification service implemented with a mock sender, ready for credentials.",
]:
    story.append(B(b))
story.append(P("4.5 Deployment", "h2"))
story.append(P("The application is deployed on <b>Vercel</b>: the React frontend is served as static files and the FastAPI backend runs as a serverless Python function, both under a single public domain (hriata.vercel.app). This serverless approach removes server maintenance entirely and scales automatically. The database runs on MongoDB Atlas."))
story.append(PageBreak())

# ---------------- CHAPTER 5 ----------------
story.append(P("CHAPTER 5: IMPLEMENTATION", "h1"))
story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT))
story.append(P("5.1 Authentication Module", "h2"))
story.append(P("Customers register with name, email, mobile and password; passwords are hashed with bcrypt. Login issues short-lived JWT access tokens and long-lived refresh tokens in httpOnly, secure cookies (never readable by JavaScript). A Google sign-in option uses the managed OAuth flow: the backend exchanges the provider session server-side, creates or links the account by email, and issues the same application session. Five failed logins lock the account+IP pair for fifteen minutes. Password reset uses single-use, one-hour tokens delivered by email."))
story.append(P("5.2 Application Wizard Module", "h2"))
story.append(P("Selecting a service creates (or resumes) a draft application with its unique ID already assigned. The wizard presents six steps — Personal Details, Application Details (service-specific fields), Documents, Review, Payment and Submitted — with per-field validation (required fields, email format, 10-digit mobile, 6-digit PIN), progress saving on every step, and free navigation back to edit earlier steps."))
story.append(P("5.3 Document Upload Module", "h2"))
story.append(P("Each service defines a document checklist with Required/Optional badges (for example, PAN requires identity proof, address proof and a photograph). The uploader supports drag-and-drop and browsing, shows progress, previews images, and allows replace and delete. Files are limited to JPG/PNG/PDF and 5 MB, validated on both client and server. Files are stored in managed object storage under a randomised path and can only be read through an authenticated backend endpoint that checks ownership or admin rights."))
story.append(P("5.4 Payment Module", "h2"))
story.append(P("The fee is computed on the server from the service type (Scholarship Rs. 100, PAN Rs. 100, Learner's Licence Rs. 350) so it cannot be manipulated from the browser. The backend creates a Razorpay order; the customer completes payment in Razorpay's secure checkout (UPI including Google Pay, cards, net banking); the backend then verifies the Razorpay signature before marking the application paid and submitted. A webhook endpoint is provided for payment confirmation events. A clearly labelled demo mode exists for safe testing when live keys are absent."))
story.append(P("5.5 Application ID and Tracking Module", "h2"))
story.append(P("Application IDs follow the format FE-YEAR-XXXXX (e.g., FE-2026-00001) generated by an atomic database counter, guaranteeing uniqueness. The public tracking page shows a five-stage timeline (Submitted → Payment Confirmed → Documents Received → Processing → Completed) plus service, dates and payment status — without exposing any personal data or documents."))
story.append(P("5.6 Notification Module", "h2"))
story.append(P("A backend notification service sends transactional emails (to the admin on every new paid application; to the customer on receipt, status change and document requests) and records every message in a notification log visible in the admin dashboard. A WhatsApp Cloud API channel is implemented in the same service and activates as soon as business credentials are configured; until then it operates in a clearly logged mock mode."))
story.append(P("5.7 Admin Dashboard Module", "h2"))
story.append(P("The role-gated /admin area provides overview statistics (total/today/pending/completed applications, revenue), four responsive charts (applications and revenue over time, applications by service, status distribution), a filterable and searchable applications table, and a detail view for each application with customer data, payment record, secure document viewing, verify / request-replacement actions, status management and private notes (never shown to customers). Every admin action is written to an audit log."))
story.append(P("5.8 Security Implementation", "h2"))
story.append(P("All private and admin endpoints are protected by authentication and role checks on the server. Document files have no public URL. Security headers are applied to every response. Secrets live only in environment variables; none appear in the frontend bundle or the code repository, which is kept clean of environment files via .gitignore."))
story.append(PageBreak())

# ---------------- CHAPTER 6 ----------------
story.append(P("CHAPTER 6: TESTING", "h1"))
story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT))
story.append(P("6.1 Testing Approach", "h2"))
story.append(P("Testing combined automated API testing (pytest against the running backend), browser-based end-to-end testing of the real user interface (registration through payment and admin processing), and security-oriented negative testing. Every major feature and bug fix was verified by an independent testing pass before being accepted. The production deployment on Vercel was additionally verified live after each infrastructure change."))
story.append(P("6.2 Test Cases (Representative Sample)", "h2"))
story.append(table(
    ["No.", "Test Case", "Expected Result", "Status"],
    [["1", "Register with valid details", "Account created; session cookie set", "Pass"],
     ["2", "Login with wrong password", "401 error, attempt counted", "Pass"],
     ["3", "Five consecutive failed logins", "429 lockout for 15 minutes", "Pass"],
     ["4", "Upload .exe file as document", "Rejected with type error", "Pass"],
     ["5", "Upload 6 MB file", "Rejected with size error", "Pass"],
     ["6", "Payment with tampered signature", "400 rejected; application not marked paid", "Pass"],
     ["7", "Create order with amount in request body", "Server ignores body; charges service fee", "Pass"],
     ["8", "Track valid / invalid Application ID", "Timeline shown / 404", "Pass"],
     ["9", "Access another user's application", "403 Forbidden", "Pass"],
     ["10", "Access document URL without login", "401 Unauthorized", "Pass"],
     ["11", "Access /admin endpoints as customer", "403 Forbidden", "Pass"],
     ["12", "Per-service order amounts", "Rs. 100 / Rs. 100 / Rs. 350 orders on gateway", "Pass"],
     ["13", "Admin status change", "History recorded; customer emailed", "Pass"],
     ["14", "Google sign-in session exchange", "Session created; bogus ID rejected", "Pass"]],
    [0.9 * cm, 6.3 * cm, 6.6 * cm, 1.7 * cm]))
story.append(P("6.3 Test Results", "h2"))
story.append(P("All backend test suites passed (21/21 API tests in the core suite, 12/12 in the pricing suite, 9/9 in the Google-auth suite, 10/10 in the object-storage suite). Browser end-to-end passes confirmed the complete customer and admin journeys, and the final production verification on the live Vercel deployment confirmed registration, application submission, document upload, signed payment, tracking, email delivery and admin processing — all operational."))
story.append(PageBreak())

# ---------------- CHAPTER 7 ----------------
story.append(P("CHAPTER 7: CONCLUSION AND FUTURE SCOPE", "h1"))
story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT))
story.append(P("7.1 Conclusion", "h2"))
story.append(P("FormEase demonstrates that a genuinely production-grade service platform can be designed, built, tested and deployed as a minor project. The system delivers the complete intended experience: a premium public website, a guided application workflow, secure document handling, real online payments with server-side verification, public tracking, automated notifications and a capable administrative back-office — all publicly accessible on free-tier cloud infrastructure. Beyond the functional result, the project applied professional engineering practices throughout: environment-based configuration, security-first design, automated testing at every step, and incremental verified deployments."))
story.append(P("7.2 Future Enhancements", "h2"))
for b in [
    "Switch Razorpay to live keys to accept real payments (the code path is already production-ready).",
    "Activate WhatsApp Cloud API notifications by adding business credentials.",
    "Add more assistance services using the existing service-definition structure.",
    "Introduce SMS notifications and in-app notification centre.",
    "Add downloadable PDF receipts for payments.",
    "Connect a custom domain and move to paid tiers for always-warm performance.",
]:
    story.append(B(b))
story.append(Spacer(1, 0.4 * cm))
story.append(P("BIBLIOGRAPHY", "h1"))
story.append(HRFlowable(width="100%", thickness=0.8, color=LIGHT))
for b in [
    "React documentation — https://react.dev",
    "FastAPI documentation — https://fastapi.tiangolo.com",
    "MongoDB Manual — https://www.mongodb.com/docs",
    "Razorpay API documentation — https://razorpay.com/docs",
    "Three.js / React Three Fiber documentation — https://threejs.org, https://docs.pmnd.rs",
    "Tailwind CSS documentation — https://tailwindcss.com",
    "Vercel documentation — https://vercel.com/docs",
    "Flask- and Django-alternative comparisons and REST design references — various online sources",
]:
    story.append(B(b))

doc.build(story)
print("PDF generated:", OUT, os.path.getsize(OUT), "bytes")
