import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { UserDTO } from "@/lib/dto/user";
import type { EmotionLogEntry } from "@/lib/emotion-log";
import type {
  EmotionDistributionRow,
  TrendPoint,
  SessionSummary,
  WellnessInsight,
} from "@/lib/mock-report-data";

interface GeneratePDFReportOptions {
  user: UserDTO | null;
  entries: EmotionLogEntry[];
  distribution: EmotionDistributionRow[];
  trend: TrendPoint[];
  sessions: SessionSummary[];
  insights: WellnessInsight[];
}

export function generatePDFReport({
  user,
  entries,
  distribution,
  trend,
  sessions,
  insights,
}: GeneratePDFReportOptions): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = new Date();

  // Colors
  const brandPrimary = [79, 70, 229]; // Indigo / Royal Blue
  const brandSecondary = [14, 165, 233]; // Sky
  const textDark = [15, 23, 42]; // Slate 900
  const textMuted = [100, 116, 139]; // Slate 500
  const bgCard = [248, 250, 252]; // Slate 50
  const borderGray = [226, 232, 240]; // Slate 200

  // 1. Top Decorative Brand Banner
  doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.rect(0, 0, pageWidth, 6, "F");

  let y = 16;

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text("MindCare", margin, y);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("AI-Powered Mental Health & Emotional Wellness System", margin, y + 5);

  // Document Type / ID (Top Right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("CONFIDENTIAL REPORT", pageWidth - margin, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const reportId = `MCR-${format(generatedAt, "yyyyMMdd")}-${user?.id ? user.id.slice(-6).toUpperCase() : "GUEST"}`;
  doc.text(`Report ID: ${reportId}`, pageWidth - margin, y + 4.5, { align: "right" });
  doc.text(`Generated: ${format(generatedAt, "MMM d, yyyy 'at' h:mm a")}`, pageWidth - margin, y + 8.5, { align: "right" });

  y += 14;

  // Horizontal divider
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;

  // 2. User Identity & Account Information Card
  const userBoxHeight = 32;
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, y, contentWidth, userBoxHeight, 3, 3, "FD");

  // Box title badge
  doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.roundedRect(margin + 5, y + 4, 28, 5.5, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("USER PROFILE", margin + 7.5, y + 7.8);

  const col1X = margin + 6;
  const col2X = margin + (contentWidth / 3) + 2;
  const col3X = margin + ((contentWidth / 3) * 2) + 2;

  const row1Y = y + 15;
  const row2Y = y + 25;

  // Row 1
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Full Name:", col1X, row1Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(user?.name || "Anonymous User", col1X + 17, row1Y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Account Email:", col2X, row1Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(user?.email || "Not linked", col2X + 22, row1Y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Timezone:", col3X, row1Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(user?.timezone || "UTC", col3X + 16, row1Y);

  // Row 2
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Member Since:", col1X, row2Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const memberDate = user?.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy") : "Active User";
  doc.text(memberDate, col1X + 22, row2Y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Check-ins Logged:", col2X, row2Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${entries.length} moments`, col2X + 28, row2Y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Status:", col3X, row2Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(16, 149, 107); // Emerald
  doc.text("Active Account", col3X + 12, row2Y);

  y += userBoxHeight + 8;

  // 3. Section: Executive Wellness Insights
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("1. Executive Wellness Insights", margin, y);

  y += 4;

  insights.forEach((insight) => {
    doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "FD");

    // Bullet indicator
    doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.circle(margin + 4, y + 5, 1.2, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const splitText = doc.splitTextToSize(insight.text, contentWidth - 12);
    doc.text(splitText, margin + 8, y + 6);

    y += 12;
  });

  y += 4;

  // 4. Section: Emotion Distribution Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("2. Emotional Distribution Breakdown", margin, y);

  y += 3;

  const totalEmotionCount = distribution.reduce((sum, d) => sum + d.count, 0);

  const distributionTableRows = distribution.map((row) => {
    const percentage = totalEmotionCount > 0 ? ((row.count / totalEmotionCount) * 100).toFixed(1) : "0.0";
    let status = "Balanced";
    if (row.emotion === "Anxious" || row.emotion === "Sad" || row.emotion === "Angry") {
      status = row.count > 3 ? "Requires Attention" : "Mild";
    } else if (row.emotion === "Calm" || row.emotion === "Hopeful") {
      status = "Positive Anchor";
    }
    return [row.emotion, `${row.count} moments`, `${percentage}%`, status];
  });

  autoTable(doc, {
    startY: y,
    head: [["Emotion State", "Frequency", "Share (%)", "Observation"]],
    body: distributionTableRows,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need page break before 7-day trend
  if (y > pageHeight - 50) {
    doc.addPage();
    y = 20;
  }

  // 5. Section: 7-Day Emotional Trend Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("3. 7-Day Emotional Stability Trend", margin, y);

  y += 3;

  const trendTableRows = trend.map((point) => {
    if (point.score === null) {
      return [
        format(point.date, "EEEE, MMMM d, yyyy"),
        point.label,
        "--",
        "No check-ins recorded",
      ];
    }

    let rating = "Steady";
    if (point.score >= 80) rating = "High Resilience / Calm";
    else if (point.score >= 60) rating = "Steady / Balanced";
    else rating = "Elevated Sensitivity";

    return [
      format(point.date, "EEEE, MMMM d, yyyy"),
      point.label,
      `${point.score} / 100`,
      rating,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Date", "Day", "Calm Moments Score", "Emotional Resilience"]],
    body: trendTableRows,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need page break before session summaries
  if (y > pageHeight - 65) {
    doc.addPage();
    y = 20;
  }

  // 6. Section: Therapy & Voice Session Summaries
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("4. Recent Session Summaries & Recaps", margin, y);

  y += 3;

  const sessionTableRows =
    sessions.length > 0
      ? sessions.map((s) => [
          format(s.date, "MMM d, yyyy"),
          `${s.durationMinutes} min`,
          s.dominantEmotion,
          s.blurb,
        ])
      : [["--", "--", "Neutral", "No therapy sessions logged yet for this period."]];

  autoTable(doc, {
    startY: y,
    head: [["Session Date", "Duration", "Dominant Emotion", "AI Discussion Summary"]],
    body: sessionTableRows,
    margin: { left: margin, right: margin },
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 20 },
      2: { cellWidth: 32 },
      3: { cellWidth: "auto" },
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // 7. Global Footer & Disclaimers on Every Page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    // Disclaimer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      "MindCare Mental Health System · Confidential Document · Generated for personal emotional reflection and wellness tracking. Not a medical or clinical diagnosis.",
      margin,
      pageHeight - 9.5
    );

    // Page numbers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 9.5,
      { align: "right" }
    );
  }

  // 8. Download the PDF File
  const safeName = (user?.name || "User").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `MindCare_Report_${safeName}_${format(generatedAt, "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
}
