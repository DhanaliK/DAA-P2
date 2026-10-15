"""Use the packaged rasterizer with Word's PDF conversion on this Windows host."""
from pathlib import Path
import importlib.util
import os

root = Path(__file__).resolve().parent.parent
runtime = Path('C:/Users/VICTUS/.cache/codex-runtimes/codex-primary-runtime/dependencies')
renderer = Path('C:/Users/VICTUS/.codex/plugins/cache/openai-primary-runtime/documents/26.1011.11113/skills/documents/render_docx.py')
out = root / '.test-output/implementation-guide-render'
spec = importlib.util.spec_from_file_location('packaged_docx_renderer', renderer)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
# LibreOffice is not bundled on this Windows host. Word exported this exact DOCX.
pdf = out / 'word-layout.pdf'
assert pdf.exists() and pdf.stat().st_size > 0
module.convert_to_pdf = lambda *args, **kwargs: (str(pdf), 'Native Word PDF export')
poppler = next((runtime / 'native/poppler').rglob('pdftoppm.exe')).parent
os.environ['PATH'] = str(poppler) + os.pathsep + os.environ['PATH']
pages = module.rasterize(str(root / 'docs/AlgoAdapt_Implementation_and_Viva_Guide.docx'), str(out), 120, False, False)
print(f'Rendered {len(pages)} pages with the packaged DOCX rasterizer')

from pypdf import PdfReader
p = PdfReader(pdf)
for i,page in enumerate(p.pages):
    lines = page.extract_text().splitlines()
    print(i+1, len(page.extract_text().split()), ' | '.join(lines[:2]))
assert len(p.pages) == 28, f'Expected 28 pages, got {len(p.pages)}; check overflow'
