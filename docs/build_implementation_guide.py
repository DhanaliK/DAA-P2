from pathlib import Path
import re

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT

ROOT = Path(__file__).resolve().parent
source = (ROOT / 'implementation-guide-source.md').read_text(encoding='utf-8')
doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Inches(8.27), Inches(11.69)
sec.top_margin = sec.bottom_margin = Inches(.68)
sec.left_margin = sec.right_margin = Inches(.72)
sec.footer_distance = Inches(.3)
for name in ['Normal', 'Title', 'Subtitle', 'Heading 1', 'Heading 2', 'Heading 3']:
    st = doc.styles[name]
    st.font.name = 'Calibri'
    st.font.color.rgb = RGBColor(0, 0, 0)
    st.font.size = Pt(11)
    st.paragraph_format.space_after = Pt(7)
    st.paragraph_format.line_spacing = 1.08
    for border in list(st.element.xpath('./w:pPr/w:pBdr')):
        border.getparent().remove(border)
doc.styles['Title'].font.size = Pt(27)
doc.styles['Title'].font.bold = True
doc.styles['Title'].paragraph_format.space_after = Pt(15)
doc.styles['Heading 1'].font.size = Pt(19)
doc.styles['Heading 1'].font.bold = True
doc.styles['Heading 1'].paragraph_format.space_after = Pt(12)
doc.styles['Heading 2'].font.size = Pt(12)
doc.styles['Heading 2'].font.bold = True
doc.styles['Heading 2'].paragraph_format.space_before = Pt(9)
doc.styles['Heading 2'].paragraph_format.space_after = Pt(5)
doc.styles['Normal'].paragraph_format.widow_control = True

def text(p, value, size=None):
    for part in re.split(r'(\*\*.*?\*\*)', value):
        run = p.add_run(part[2:-2] if part.startswith('**') else part)
        run.bold = part.startswith('**')
        if size: run.font.size = Pt(size)

def table(lines):
    rows = [[c.strip() for c in line.strip('|').split('|')] for line in lines]
    widths = ([2.25,4.58] if len(rows[0]) == 2 else
              [1.38,2.53,2.92] if len(rows[0]) == 3 else [1.2,1.95,2.73,.95])
    if rows[0][0] == 'ID': widths = [.48,6.35]
    if rows[0][0] == 'Algorithm' and len(rows[0]) == 3: widths = [1.22,3.92,1.69]
    if rows[0][0] == 'Property': widths = [1.72,3.66,1.45]
    t = doc.add_table(rows=0, cols=len(rows[0]))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    for col,w in zip(t.columns,widths): col.width = Inches(w)
    borders = OxmlElement('w:tblBorders')
    for side in ['top','left','bottom','right','insideH','insideV']:
        el = OxmlElement('w:'+side)
        for key,val in [('val','single'),('sz','5'),('color','D9D9D9')]: el.set(qn('w:'+key),val)
        borders.append(el)
    t._tbl.tblPr.append(borders)
    for ri,row in enumerate(rows):
        cells = t.add_row().cells
        trpr = t.rows[-1]._tr.get_or_add_trPr()
        trpr.append(OxmlElement('w:cantSplit'))
        if ri == 0: trpr.append(OxmlElement('w:tblHeader'))
        for ci,(cell,value) in enumerate(zip(cells,row)):
            cell.width = Inches(widths[ci])
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            pr = cell._tc.get_or_add_tcPr()
            margins = OxmlElement('w:tcMar')
            for side,val in [('top',85),('bottom',85),('left',95),('right',95)]:
                el = OxmlElement('w:'+side); el.set(qn('w:w'),str(val)); el.set(qn('w:type'),'dxa'); margins.append(el)
            pr.append(margins)
            sh = OxmlElement('w:shd'); sh.set(qn('w:fill'),'233E50' if ri == 0 else 'F1F5F7' if ri%2==0 else 'FFFFFF');pr.append(sh)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.04
            text(p,value.replace('/', '/\u200b'),10)
            if ri == 0:
                for run in p.runs: run.bold=True;run.font.color.rgb=RGBColor(255,255,255)
            if ci == 0 and rows[0][0] == 'ID': p.alignment=WD_ALIGN_PARAGRAPH.CENTER
            if ci > 0 and re.fullmatch(r'-?\d+(?:\.\d+)?(?:/\d+)?', value):
                p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p=doc.add_paragraph();p.paragraph_format.space_after=Pt(1);p.paragraph_format.space_before=Pt(0);p.paragraph_format.line_spacing=Pt(2)
    p.add_run().font.size=Pt(2)

pages = source.split('<!-- PAGE -->')
for index,page in enumerate(pages):
    lines=page.strip().splitlines();i=0
    while i<len(lines):
        line=lines[i].strip()
        if not line:i+=1;continue
        if line.startswith('|'):
            block=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                block.append(lines[i].strip());i+=1
            table(block);continue
        if line.startswith('# '):
            p=doc.add_paragraph(line[2:],'Title' if index==0 else 'Heading 1')
            p.paragraph_format.page_break_before = bool(index)
            # Named bookmarks make the Word Navigation Pane and links useful.
            start=OxmlElement('w:bookmarkStart');start.set(qn('w:id'),str(index));start.set(qn('w:name'),f'section_{index}');p._p.insert(0,start)
            end=OxmlElement('w:bookmarkEnd');end.set(qn('w:id'),str(index));p._p.append(end)
        elif line.startswith('## '):doc.add_paragraph(line[3:],'Heading 2')
        elif line.startswith('CODE '):
            p=doc.add_paragraph();r=p.add_run(line[5:]);r.font.name='Consolas';r.font.size=Pt(9)
            p.paragraph_format.space_after=Pt(6)
        else:
            p=doc.add_paragraph();text(p,line)
            if line.startswith('https://'):
                for r in p.runs:r.font.size=Pt(9)
        i += 1
    # Avoid a keep-with-next chain at the page's final body paragraph.
    doc.paragraphs[-1].paragraph_format.keep_with_next=False

footer=sec.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.RIGHT
r=footer.add_run('AlgoAdapt implementation guide   |   ');r.font.size=Pt(9)
field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');footer._p.append(field)
doc.core_properties.title='AlgoAdapt Implementation and Viva Guide'
doc.core_properties.subject='Implementation, algorithm selection, analysis, benchmarking and viva preparation'
doc.core_properties.author='AlgoAdapt project documentation'
doc.core_properties.keywords='DAA, algorithm selection, sorting, searching, graphs, viva'
out=ROOT/'AlgoAdapt_Implementation_and_Viva_Guide.docx'
doc.save(out)
print(f'Created {out}; {len(pages)} planned pages; {len(source.split())} source words')
