from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUTPUT = r"C:\Users\abuba\Downloads\ZQ_Removals_Invoice_27_Recreated.pdf"

navy = colors.HexColor("#0A192F")
blue = colors.HexColor("#137DC5")
light = colors.HexColor("#F3F7FA")
muted = colors.HexColor("#51606F")

styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="InvoiceTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=30,
        textColor=navy,
        alignment=TA_RIGHT,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="SmallMuted",
        parent=styles["BodyText"],
        fontSize=8.5,
        leading=12,
        textColor=muted,
    )
)
styles.add(
    ParagraphStyle(
        name="SectionLabel",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=blue,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyStrong",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=navy,
    )
)
styles.add(
    ParagraphStyle(
        name="Body",
        parent=styles["BodyText"],
        fontSize=9.5,
        leading=14,
        textColor=navy,
    )
)
styles.add(
    ParagraphStyle(
        name="Total",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=navy,
        alignment=TA_RIGHT,
    )
)


def p(text, style="Body"):
    return Paragraph(text, styles[style])


doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=20 * mm,
    leftMargin=20 * mm,
    topMargin=18 * mm,
    bottomMargin=18 * mm,
    title="ZQ Removals Invoice 27",
    author="ZQ Removals",
)

story = []

header = Table(
    [
        [
            [
                p("ZQ REMOVALS", "BodyStrong"),
                p("Adelaide relocation and moving services", "SmallMuted"),
                Spacer(1, 4),
                p("ABN 97 954 095 119", "SmallMuted"),
                p("0433 819 989", "SmallMuted"),
                p("zqremovals.au@gmail.com", "SmallMuted"),
            ],
            [
                p("INVOICE", "InvoiceTitle"),
                p("<b>Invoice No:</b> 27", "SmallMuted"),
                p("<b>Invoice Date:</b> 26 November 2025", "SmallMuted"),
                p("<b>Due Date:</b> 28 November 2025", "SmallMuted"),
            ],
        ]
    ],
    colWidths=[95 * mm, 75 * mm],
)
header.setStyle(
    TableStyle(
        [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -1), 2, blue),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ]
    )
)
story.extend([header, Spacer(1, 14)])

story.append(p("MOVE REFERENCE", "SectionLabel"))
move_ref = Table(
    [
        [
            p("<b>Pickup</b><br/>2A Park Lane<br/>Flagstaff Hill SA", "Body"),
            p("<b>Delivery</b><br/>26 Middleborough Tce<br/>Clyde VIC 3978", "Body"),
        ]
    ],
    colWidths=[85 * mm, 85 * mm],
)
move_ref.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, -1), light),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#D5E0E8")),
            ("INNERGRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#D5E0E8")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]
    )
)
story.extend([move_ref, Spacer(1, 18)])

story.append(p("SERVICES", "SectionLabel"))
items = Table(
    [
        [
            p("<b>Description</b>", "Body"),
            p("<b>Pricing</b>", "Body"),
            p("<b>Amount (AUD)</b>", "Body"),
        ],
        [
            p(
                "<b>Interstate move including insurance</b><br/>"
                "Fixed-price relocation from Flagstaff Hill SA to Clyde VIC.",
                "Body",
            ),
            p("Fixed price", "Body"),
            p("$1,400.00", "Body"),
        ],
    ],
    colWidths=[100 * mm, 30 * mm, 40 * mm],
    repeatRows=1,
)
items.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), navy),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#CCD8E0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DCE5EB")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ]
    )
)
story.extend([items, Spacer(1, 10)])

total = Table(
    [[p("TOTAL DUE", "BodyStrong"), p("AUD $1,400.00", "Total")]],
    colWidths=[110 * mm, 60 * mm],
)
total.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, -1), light),
            ("LINEABOVE", (0, 0), (-1, 0), 1.5, blue),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]
    )
)
story.extend([total, Spacer(1, 24)])

story.append(p("PAYMENT DETAILS", "SectionLabel"))
payment = Table(
    [
        [p("<b>Bank</b>", "Body"), p("Westpac", "Body")],
        [p("<b>Account Name</b>", "Body"), p("Qasim Ali", "Body")],
        [p("<b>BSB</b>", "Body"), p("732-006", "Body")],
        [p("<b>Account Number</b>", "Body"), p("682894", "Body")],
        [p("<b>Payment Reference</b>", "Body"), p("Invoice 27", "Body")],
    ],
    colWidths=[50 * mm, 120 * mm],
)
payment.setStyle(
    TableStyle(
        [
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#D5E0E8")),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E9EE")),
            ("BACKGROUND", (0, 0), (0, -1), light),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]
    )
)
story.extend(
    [
        payment,
        Spacer(1, 18),
        p(
            "Please include invoice number <b>27</b> as the payment reference. "
            "Thank you for choosing ZQ Removals.",
            "SmallMuted",
        ),
    ]
)

doc.build(story)
print(OUTPUT)
