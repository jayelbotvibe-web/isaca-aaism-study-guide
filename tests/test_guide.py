"""Content and packaging checks. Run with Python's standard-library unittest."""
import json,re,subprocess,sys,unittest
import xml.etree.ElementTree as ET
from pathlib import Path
from collections import Counter
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]

class Node:
    def __init__(self,tag,attrs,parent):
        self.tag=tag;self.attrs=dict(attrs);self.parent=parent;self.children=[];self.content=[]
    def inside(self,predicate):
        p=self.parent
        while p:
            if predicate(p):return True
            p=p.parent
        return False
    def hasclass(self,c):return c in self.attrs.get('class','').split()
    def text(self):return ''.join(self.content)

class Document(HTMLParser):
    VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    def __init__(self,raw):
        super().__init__();self.nodes=[];self.stack=[];self.feed(raw)
    def handle_starttag(self,tag,attrs):
        parent=self.stack[-1] if self.stack else None
        node=Node(tag,attrs,parent);self.nodes.append(node)
        if parent:parent.children.append(node)
        if tag not in self.VOID:self.stack.append(node)
    def handle_startendtag(self,tag,attrs):
        self.handle_starttag(tag,attrs)
        if tag not in self.VOID:self.handle_endtag(tag)
    def handle_endtag(self,tag):
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i].tag==tag:self.stack=self.stack[:i];break
    def handle_data(self,data):
        for p in self.stack:p.content.append(data)

class GuideTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw=(ROOT/'index.html').read_text();cls.doc=Document(cls.raw)
        cls.ids={n.attrs['id']:n for n in cls.doc.nodes if 'id' in n.attrs}
        cls.chapters=json.loads((ROOT/'content/chapters.json').read_text())
        cls.questions=json.loads((ROOT/'content/practice.json').read_text())
        cls.sources=json.loads((ROOT/'content/sources.json').read_text())
        cls.visuals=json.loads((ROOT/'content/visuals.json').read_text())

    def test_no_duplicate_or_unresolved_ids(self):
        ids=[n.attrs['id'] for n in self.doc.nodes if 'id' in n.attrs]
        self.assertEqual(len(ids),len(set(ids)))
        for n in self.doc.nodes:
            href=n.attrs.get('href','')
            if href.startswith('#'):self.assertIn(href[1:],self.ids,href)

    def test_all_chapters_have_application_and_recall(self):
        self.assertEqual(len(self.chapters),31)
        for c in self.chapters:
            self.assertIn(c['id'],self.ids)
            self.assertIn('case-'+c['id'],self.ids)
            self.assertEqual(len(c['questions']),3);self.assertEqual(len(c['answers']),3)
            self.assertTrue(c['objective'] and c['case'] and c['sources'])

    def test_question_bank_coverage_and_explanations(self):
        self.assertEqual(len(self.questions),90)
        self.assertEqual(Counter(q['domain'] for q in self.questions),{1:28,2:28,3:34})
        self.assertEqual(Counter(q['answer'] for q in self.questions),{0:23,1:23,2:22,3:22})
        self.assertEqual({t for q in self.questions for t in q['tasks']},set(range(1,23)))
        diagnostic=[q for q in self.questions if q['diagnostic']]
        self.assertEqual(len(diagnostic),13)
        self.assertEqual(len({q['subtopic'] for q in diagnostic}),13)
        for q in self.questions:
            self.assertIn(q['id'],self.ids)
            self.assertEqual(len(q['options']),4)
            self.assertTrue(all(o['explanation'] for o in q['options']))
            self.assertIn('case-'+q['chapter'],self.ids)

    def test_choices_are_outside_solution_reveal(self):
        labels=[n for n in self.doc.nodes if n.tag=='input' and n.attrs.get('name','').startswith('q')]
        self.assertEqual(len(labels),360)
        for n in labels:
            self.assertFalse(n.inside(lambda p:p.tag=='details'))
            self.assertIn(n.attrs['name'],self.ids)
            self.assertTrue(any(x.tag=='label' and x.attrs.get('for')==n.attrs['id'] for x in self.doc.nodes))

    def test_diagrams_have_text_equivalents(self):
        figures=[n for n in self.doc.nodes if n.tag=='figure']
        transcripts=[n for n in self.doc.nodes if n.hasclass('figure-text')]
        self.assertEqual(len(figures),24+len(self.visuals));self.assertEqual(len(transcripts),len(figures))
        self.assertTrue(all(n.text().strip() for n in transcripts))
        for i,(figure,transcript) in enumerate(zip(figures,transcripts),1):
            caption=next(n for n in figure.children if n.tag=='figcaption')
            self.assertTrue(caption.text().startswith('Fig. '+str(i)+' — '))
            self.assertEqual(transcript.children[0].text(),'Read Figure '+str(i)+' as text')
            siblings=figure.parent.children
            self.assertIs(siblings[siblings.index(figure)+1],transcript)

    def test_study_visuals_are_accessible_offline_and_in_the_right_chapters(self):
        self.assertEqual(len(self.visuals),18)
        self.assertEqual(len({v['id'] for v in self.visuals}),len(self.visuals))
        figures=[n for n in self.doc.nodes if n.tag=='figure']
        # All chapters now have at least one explanatory visual.
        for chapter in self.chapters:
            self.assertTrue(any(f.inside(lambda p:p.attrs.get('id')==chapter['id']) for f in figures),chapter['id'])
        ns={'s':'http://www.w3.org/2000/svg'}
        for v in self.visuals:
            figure=self.ids['visual-'+v['id']]
            self.assertTrue(figure.inside(lambda p:p.attrs.get('id')==v['chapter']))
            self.assertTrue(v['title'] and len(v['description'])>=3)
            source=(ROOT/'content/visuals'/(v['id']+'.svg')).read_text()
            self.assertIn(source.strip(),self.raw)
            svg=ET.fromstring(source)
            self.assertEqual(svg.attrib.get('role'),'img')
            self.assertEqual(svg.attrib.get('viewBox','').split()[:3],['0','0','960'])
            self.assertTrue(svg.find('s:title',ns).text)
            self.assertTrue(svg.find('s:desc',ns).text)
            ids={el.attrib['id'] for el in svg.iter() if 'id' in el.attrib}
            self.assertTrue(set(svg.attrib['aria-labelledby'].split())<=ids)
            for el in svg.iter():
                self.assertNotIn(el.tag.rsplit('}',1)[-1],['script','foreignObject','image'])
                for key,value in el.attrib.items():
                    self.assertFalse(key.startswith('on'))
                    self.assertFalse(value.startswith(('http:','https:','//')))
                    for ref in re.findall(r'url\(#([^)]+)\)',value):self.assertIn(ref,ids)

    def test_chapter_link_labels_match_destinations(self):
        nums={c['id']:str(i+1) for i,c in enumerate(self.chapters)}
        for n in self.doc.nodes:
            if n.tag=='a' and n.hasclass('chapter-ref') and n.text().startswith('Chapter '):
                dest=n.attrs['href'][1:]
                self.assertEqual(n.text().strip(),'Chapter '+nums[dest])

    def test_no_automatic_external_resources(self):
        for n in self.doc.nodes:
            if n.tag in ['script','img','iframe','audio','video','source']:
                self.assertFalse(n.attrs.get('src','').startswith(('http:','https:','//')))
            if n.tag=='link':self.assertFalse(n.attrs.get('href','').startswith(('http:','https:','//')))
        self.assertNotRegex(self.raw,r'\b(?:fetch|XMLHttpRequest|sendBeacon)\s*\(')

    def test_source_integrity_and_glossary_order(self):
        source_ids={s['id'] for s in self.sources}
        self.assertEqual(len(source_ids),len(self.sources))
        for c in self.chapters:self.assertTrue(set(c['sources'])<=source_ids)
        self.assertTrue(all(s['url'].startswith('https://') and s['edition'] and s['note'] for s in self.sources))
        terms=[n.text() for n in self.doc.nodes if n.tag=='dt' and n.inside(lambda p:p.attrs.get('id')=='gloss')]
        self.assertGreater(len(terms),90);self.assertEqual(terms,sorted(terms,key=str.casefold))

    def test_obsolete_absolute_claims_removed(self):
        for phrase in ['no future engineering fixes it','There is no after.','impossible to selectively undo','a form nobody can index, isolate or remove','Containment precedes notification. Always.','Four kinds of box appear','Part II spends three chapters','zero-risk answers are wrong answers']:
            self.assertNotIn(phrase,self.raw)

    def test_build_is_reproducible(self):
        before=(ROOT/'index.html').read_bytes()
        subprocess.run([sys.executable,str(ROOT/'scripts/build.py')],cwd=ROOT,check=True,capture_output=True)
        self.assertEqual(before,(ROOT/'index.html').read_bytes())

if __name__=='__main__':unittest.main()
