#!/usr/bin/env python3
"""Render authoring JSON into the distributable HTML; Python standard library only."""
from pathlib import Path
from collections import Counter
from html import escape as esc
import json,re

ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/'content'/name).read_text())
chapters=read('chapters.json');questions=read('practice.json');sources=read('sources.json');visuals=read('visuals.json')
source_map={x['id']:x for x in sources}
numbers={x['id']:i+1 for i,x in enumerate(chapters)}
topic_names={
 '1A':'Stakeholders, frameworks and regulation','1B':'Strategy, policy and procedures','1C':'Asset and data lifecycle management','1D':'Security program management','1E':'Continuity and incident response',
 '2A':'Risk assessment, thresholds and treatment','2B':'Threats and vulnerabilities','2C':'Vendors and supply chain',
 '3A':'Architecture and design','3B':'Model lifecycle','3C':'Data controls','3D':'Privacy, ethics, trust and safety','3E':'Controls and monitoring'}
task_names=[
 'Charter and accountable roles','AI security policy and procedures','Responsible use and obligations','AI risk and enterprise integration','Threat-landscape assessment','Change and reassessment triggers','Testing and vulnerability handling','Impact assessment and conformity','Supplier security requirements','AI security architecture','Enterprise architecture integration','Controls and acceptable residual risk','Asset inventory and classification','Data-related security risk','Incident investigation and reporting','Incident handling and recovery','Continuity and disaster recovery','Metrics and monitoring','Security tool evaluation','Risk-based human oversight','Awareness and acceptable use','Secure solution lifecycle']

def link(sid):return '<a class="chapter-ref" href="#'+sid+'">Chapter '+str(numbers[sid])+'</a>'
def qlink(q):return '<a class="question-ref" href="#'+q['id']+'">'+q['id'].upper()+'</a>'
def module(c):
 refs='; '.join('<a href="'+esc(source_map[x]['url'],quote=True)+'">'+esc(source_map[x]['title'])+'</a>' for x in c['sources'])
 review=''.join('<li>'+esc(q)+'<details class="answer-guide"><summary>Suggested answer</summary><p>'+esc(a)+'</p></details></li>' for q,a in zip(c['questions'],c['answers']))
 return '<div class="box ex lesson-case" id="case-'+c['id']+'"><span class="tag">Calder · apply the chapter</span><p>'+esc(c['case'])+'</p></div><div class="box chk"><span class="tag">Retrieve and explain</span><ol>'+review+'</ol></div><p class="source-note"><strong>Read further:</strong> '+refs+'. <a href="#sources">Source scope and dates</a>.</p>'

def practice():
 out=['<p class="lead">90 original scenarios: 28 governance, 28 risk and 34 technologies/controls questions. Select an answer before revealing explanations. This is an author-created practice form, not a calibrated prediction of exam results.</p>',
 '<div id="practice-controls" class="practice-controls"><label for="practice-scope">Questions</label><select id="practice-scope"><option value="all">All 90</option><option value="diagnostic">Diagnostic: 13 topics</option><option value="1">Domain 1</option><option value="2">Domain 2</option><option value="3">Domain 3</option></select><button type="button" id="practice-grade">Review selected answers</button><button type="button" id="practice-timed">Start new 150-minute run</button><button type="button" id="practice-reset">Reset practice</button><button type="button" id="practice-export">Download learning record</button><button type="button" id="practice-print">Print questions only</button><p id="practice-timer" role="timer" aria-live="off"></p><p id="practice-status" role="status" aria-live="polite"></p><div id="practice-results" aria-live="polite"></div></div>',
 '<p class="source-note">Choices and timer are kept only in this browser when storage is available. No account or network request is required. Diagnostic questions are part of this form; prior exposure and repeated attempts can inflate scores. Resetting removes this practice record, not your reading position.</p>']
 for q in questions:
  qid=q['id'];ans=q['answer'];letters='ABCD'
  out.append('<div class="practice-question" id="'+qid+'" data-domain="'+str(q['domain'])+'" data-topic="'+q['subtopic']+'" data-diagnostic="'+str(q['diagnostic']).lower()+'" data-answer="'+str(ans)+'">')
  out.append('<fieldset><legend><span class="qn">'+qid.upper()+'</span> '+esc(q['stem'])+'</legend>')
  for i,o in enumerate(q['options']):
   oid=qid+'-'+str(i)
   out.append('<label class="practice-option" for="'+oid+'"><input id="'+oid+'" type="radio" name="'+qid+'" value="'+str(i)+'"/><span><b>'+letters[i]+'.</b> '+esc(o['text'])+'</span></label>')
  out.append('</fieldset><details class="practice-solution"><summary>Reveal answer and reasoning</summary><div class="practice-explanation"><p><strong>Answer '+letters[ans]+':</strong> '+esc(q['options'][ans]['text'])+'</p><ul>')
  out.extend('<li><strong>'+letters[i]+':</strong> '+esc(o['explanation'])+'</li>' for i,o in enumerate(q['options']))
  out.append('</ul><p>'+esc(q['subtopic'])+' · '+link(q['chapter'])+' · Supporting tasks '+', '.join(map(str,q['tasks']))+'.</p></div></details></div>')
 return ''.join(out)

def coverage():
 out=['<p>The domain/subtopic structure and supporting-task numbers follow the <a href="'+source_map['isaca-outline']['url']+'">public ISACA outline</a>, checked 20 October 2026. The short task labels, chapter assignments, worked evidence and question mappings below are the author’s interpretation. They demonstrate instructional traceability, not official endorsement or a claim that one item establishes mastery.</p><p>Start with the <a href="#c21" class="chapter-ref">13-topic diagnostic</a>, explain uncertain decisions, then use the mapped chapters and delayed-recall exercises. All thresholds, costs and Calder artifacts are fictional teaching examples.</p><table><thead><tr><th scope="col">Subtopic</th><th scope="col">Chapters</th><th scope="col">Practice</th></tr></thead><tbody>']
 for topic,name in topic_names.items():
  cc=[c for c in chapters if topic in c['subtopics']]
  qq=[q for q in questions if q['subtopic']==topic]
  out.append('<tr><th scope="row">'+topic+' · '+name+'</th><td>'+', '.join(link(c['id']) for c in cc)+'</td><td>'+', '.join(qlink(q) for q in qq)+'</td></tr>')
 out.append('</tbody></table><h4>Supporting tasks: teach, apply and check</h4><table><thead><tr><th scope="col">Task</th><th scope="col">Instruction / worked case</th><th scope="col">Practice evidence</th></tr></thead><tbody>')
 for i,name in enumerate(task_names,1):
  cc=[c for c in chapters if i in c['tasks']];qq=[q for q in questions if i in q['tasks']]
  out.append('<tr><th scope="row">'+str(i)+' · '+name+'</th><td>'+', '.join(link(c['id'])+' (<a href="#case-'+c['id']+'">case</a>)' for c in cc)+'</td><td>'+', '.join(qlink(q) for q in qq)+'</td></tr>')
 out.append('</tbody></table><p>A correct practice answer is evidence about this scenario. Test transfer by changing an assumption—active harm, delegated authority, jurisdiction, population or a completed prerequisite—and explain whether the decision changes.</p>')
 return ''.join(out)

def bibliography():
 out=['<p>Edition 3 · v3.1 · 20 October 2026. This companion uses public outlines, regulator publications, original research and identified historical reports. Standard overviews rely on public catalogue descriptions, not a reproduction or exhaustive clause review of paid ISO standards. Legal duties depend on jurisdiction, role, use and application date.</p><p>Historical cases illustrate mechanisms; allegations, demonstrations and regulatory findings are different kinds of evidence. Source notes below identify those limits. The full reference list remains in the downloaded file; opening an external link requires a connection.</p><dl class="colo">']
 for ref in sources:
  out.append('<dt id="source-'+ref['id']+'"><a href="'+esc(ref['url'],quote=True)+'">'+esc(ref['title'])+'</a></dt><dd>'+esc(ref['edition'])+'. '+esc(ref['note'])+'</dd>')
 out.append('</dl><h4>Edition history</h4><p>v3.1: 18 new illustrations, bringing the guide to 42 diagrams across all 31 chapters.</p><p>v3.0: updated explanations, Calder cases, 93 recall questions, 90 practice scenarios and a 13-subtopic/22-task coverage map.</p>')
 return ''.join(out)

def replace_block(doc,key,value):
 pattern=re.compile(r'<!-- BEGIN '+re.escape(key)+r' -->.*?<!-- END '+re.escape(key)+r' -->',re.S)
 if len(pattern.findall(doc))!=1:raise ValueError('Expected one marker pair: '+key)
 return pattern.sub(lambda _: '<!-- BEGIN '+key+' -->\n'+value+'\n<!-- END '+key+' -->',doc)

def visual(v):
 svg=(ROOT/'content/visuals'/(v['id']+'.svg')).read_text().strip()
 transcript=''.join('<li>'+esc(t)+'</li>' for t in v['description'])
 return ('<figure class="study-visual" id="visual-'+v['id']+'"><figcaption>Fig. 0 — '+esc(v['title'])+'</figcaption>'
  '<div class="visual-viewport" tabindex="0" role="group" aria-label="'+esc(v['title'],quote=True)+' — scroll horizontally on small screens">'+svg+'</div>'
  '<p class="visual-help">On a small screen, scroll the diagram sideways or choose Enlarge.</p></figure>'
  '<details class="figure-text"><summary>Read Figure 0 as text</summary><ul>'+transcript+'</ul></details>')

def number_figures(doc):
 """Number in reading order while preserving existing figure anchor IDs."""
 count=0
 def caption(m):
  nonlocal count
  count+=1
  return '<figcaption>Fig. '+str(count)+' — '+m.group(1)+'</figcaption>'
 doc=re.sub(r'<figcaption>Fig\. \d+ — (.*?)</figcaption>',caption,doc)
 transcript_count=0
 def summary(m):
  nonlocal transcript_count
  transcript_count+=1
  return '<summary>Read Figure '+str(transcript_count)+' as text</summary>'
 doc=re.sub(r'<summary>Read Figure \d+ as text</summary>',summary,doc)
 assert count==transcript_count,'Every figure needs a text equivalent'
 return doc

def build():
 assert len(chapters)==31 and len(questions)==90
 assert Counter(q['domain'] for q in questions)=={1:28,2:28,3:34}
 assert set(q['subtopic'] for q in questions)==set(topic_names)
 assert set(t for q in questions for t in q['tasks'])==set(range(1,23))
 assert len({q['id'] for q in questions})==90
 assert len([q for q in questions if q['diagnostic']])==13
 for c in chapters:
  assert len(c['questions'])==len(c['answers'])==3
  assert all(x in source_map for x in c['sources'])
 for q in questions:
  assert len(q['options'])==4 and 0<=q['answer']<4
  assert len({x['text'] for x in q['options']})==4
  assert q['chapter'] in numbers
 doc=(ROOT/'index.html').read_text()
 for c in chapters:
  doc=replace_block(doc,'notes '+c['id'],module(c))
  doc=replace_block(doc,'goal '+c['id'],'<p class="learning-goal"><strong>After this chapter:</strong> '+esc(c['objective'])+'</p>')
 doc=replace_block(doc,'practice',practice())
 doc=replace_block(doc,'coverage',coverage())
 doc=replace_block(doc,'sources',bibliography())
 for v in visuals:
  doc=replace_block(doc,'visual '+v['id'],visual(v))
 doc=number_figures(doc)
 doc=replace_block(doc,'reader-css','<style>\n'+(ROOT/'scripts/reader.css').read_text()+'\n</style>')
 doc=replace_block(doc,'reader-js','<script>\n'+(ROOT/'scripts/reader.js').read_text()+'\n</script>')
 (ROOT/'index.html').write_text(doc)
 print('Built 31 learning modules, 90 questions, 13 subtopics, 22 tasks,',doc.count('<figcaption>'),'diagrams and',len(sources),'references.')

if __name__=='__main__':build()
