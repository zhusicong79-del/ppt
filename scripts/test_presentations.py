"""Meaningful conversion test, run only with tenant-private template inputs installed."""
import json,tempfile,subprocess,sys,zipfile
from pathlib import Path
from pptx import Presentation
import fitz
from presentations import pdf_for
root=Path(sys.argv[1] if len(sys.argv)>1 else '.data/tenant-1')
files=[json.loads(p.read_text()) for p in (root/'templates').glob('*/manifest.json')]
assert len(files)>=2,'Import both company templates before this integration test'
assert sorted(f['pages'] for f in files)==[30,171]
with tempfile.TemporaryDirectory() as tmp:
 out=Path(tmp);slides=[files[0]['slides'][0],files[0]['slides'][2],files[1]['slides'][4]]
 slides[1]['title']='客户专属部署方案'
 deck=out/'deck.json';deck.write_text(json.dumps({'title':'模板集成测试','slides':slides},ensure_ascii=False))
 r=subprocess.run([sys.executable,'scripts/presentations.py','export',str(root),str(deck),str(out/'test.pptx'),'pdf'],check=True,capture_output=True,text=True)
 result=json.loads(r.stdout);p=Presentation(out/'test.pptx');assert len(p.slides)==3
 pdf=fitz.open(result['file']);assert len(pdf)==3;assert '客户专属部署方案' in pdf[1].get_text()
 original=fitz.open(pdf_for(root/'templates'/(slides[0]['native']['templateId']+'.pptx'),out/'baseline'))
 assert pdf[0].get_pixmap().samples==original[0].get_pixmap().samples,'Unchanged slide rendering changed'
 print('PASS mixed-template PPTX/PDF, original page pixel fidelity, editable native title')
