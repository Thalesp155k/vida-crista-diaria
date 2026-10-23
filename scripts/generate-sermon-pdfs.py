"""Generate the three freely downloadable sermons from their published text."""
import json
from html.parser import HTMLParser
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public' / 'assets' / 'pdfs'
DEST.mkdir(parents=True, exist_ok=True)
FONT = Path('C:/Windows/Fonts/georgia.ttf')
FONT_BOLD = Path('C:/Windows/Fonts/georgiab.ttf')
pdfmetrics.registerFont(TTFont('Georgia', str(FONT)))
pdfmetrics.registerFont(TTFont('Georgia-Bold', str(FONT_BOLD)))

class Extract(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.block = []
    def handle_starttag(self, tag, attrs):
        if tag in ('br', 'hr'):
            self.block.append('\n')
        if tag in ('p','h1','h2','h3','li','blockquote'):
            self.flush()
    def handle_endtag(self, tag):
        if tag in ('p','h1','h2','h3','li','blockquote'):
            self.flush()
    def handle_data(self, data):
        self.block.append(data)
    def flush(self):
        text = ' '.join(''.join(self.block).split())
        if text:
            self.parts.append(text)
        self.block = []

title_style = ParagraphStyle('Title', fontName='Georgia-Bold', fontSize=24, leading=31, textColor=colors.HexColor('#342a21'), spaceAfter=18)
meta_style = ParagraphStyle('Meta', fontName='Georgia', fontSize=10, leading=16, textColor=colors.HexColor('#796745'), spaceAfter=24)
body_style = ParagraphStyle('Body', fontName='Georgia', fontSize=11, leading=17, textColor=colors.HexColor('#302c26'), spaceAfter=11)

for sermon_id in ('5966', '3291', '1900'):
    item = json.loads((ROOT / 'public' / 'data' / 'sermons' / (sermon_id + '.json')).read_text(encoding='utf-8'))
    parser = Extract()
    parser.feed(item['html'])
    parser.flush()
    output = DEST / (item['slug'] + '.pdf')
    doc = SimpleDocTemplate(str(output), pagesize=A4, topMargin=58, bottomMargin=58, leftMargin=64, rightMargin=64,
                            title=item['title'], author='Pr. Madson Marinho')
    story = [Paragraph(escape(item['title']), title_style),
             Paragraph('Pr. Madson Marinho  ·  ' + escape(item['category']), meta_style)]
    story += [Paragraph(escape(text), body_style) for text in parser.parts]
    def footer(canvas, document):
        canvas.setFont('Georgia', 8)
        canvas.setFillColor(colors.HexColor('#8d7c60'))
        canvas.drawString(64, 36, 'Vida Cristã Diária  ·  leitura gratuita')
        canvas.drawRightString(A4[0]-64, 36, str(document.page))
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f'{output.name}: {len(parser.parts)} parágrafos')
