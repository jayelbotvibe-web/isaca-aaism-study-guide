# Securing the Machine · AAISM study companion

An independent guide for **ISACA Advanced in AI Security Management (AAISM)**. Edition 3 · v3.1 · 20 October 2026.

**[Read the guide](https://jayelbotvibe-web.github.io/isaca-aaism-study-guide/)**, or download `index.html` and open it locally. The complete reader works offline in one file. No account, installation or build step is needed to read it.

The guide explains how AI systems behave, how risk enters them, and how governance and controls can be verified. It follows the public three-domain outline, with weights of **31% governance, 31% risk and 38% technologies/controls**. Detailed chapter and practice mappings are the author's interpretation, not ISACA's endorsement or a guarantee of complete exam preparation.

## What is included

- 31 chapters with learning objectives, a continuing Calder Manufacturing example and three recall questions with suggested answers in each chapter.
- 42 embedded SVG diagrams, with at least one in every chapter. Each has a text equivalent and keyboard-accessible enlargement; the 18 new study illustrations also support horizontal scrolling on small screens.
- Practical examples: charter/RACI, asset inventory, program roadmap, enterprise risk record, assessment applicability, quantitative risk, supplier schedule, architecture, agent transaction limits, release gates, monitoring and continuity.
- 90 original scenario questions, distributed 28/28/34 across the domains. Every choice has an explanation, and answers are revealed separately from choices.
- A 13-topic diagnostic, domain filters, a 150-minute practice mode, saved choices, topic feedback, learning-record download and a questions-only print option.
- A map linking all 13 public subtopics and 22 supporting tasks to chapters, worked examples and practice questions.
- A linked glossary, corrected case index, dated legal snapshot and dated references with source scope and limitations.
- An illustrative 60-hour study plan that adapts to demonstrated gaps.

The new illustrations explain task selection, the build lifecycle, deployment responsibilities, policy implementation, connected assets, program evidence, parallel incident response, risk scenarios and economics, supplier dependencies, agent approvals, release gates, data lineage, fairness rates, decision evidence, monitoring, tool evaluation and practice. They sit beside the relevant subsection. Numerical and operating examples are explicitly fictional or schematic.

This question bank is one author-created practice form. Earlier diagnostic exposure and repeated attempts can inflate scores. Its results are not calibrated against the actual examination; use explanations, changed scenarios and official materials to assess understanding.

## Start reading

1. Open the guide and use **Coverage and task map** to see the structure.
2. Try the **13-topic diagnostic** before revealing explanations; record why you chose each answer.
3. Read foundations as needed, then follow the mapped chapters for your gaps.
4. Use chapter recall exercises and revisit them after a delay.
5. Attempt the complete practice form and review each rejected alternative. The timed run allows 150 minutes and holds explanations until you finish.

**Continuous** displays the whole book for browser search. Chapter, question, glossary and case links navigate to the correct section in either reading mode. Printing the book preserves its contents; **Print questions only** produces a practice paper without solutions.

## Local progress and privacy

The reader makes no automatic external requests. Reference links open external sources only when you choose them.

Reading position is saved under `aaism-book:v2:pos` using the stable section ID, section-relative offset and reading mode. Compatible older positions can be migrated. Practice choices, selected scope and a timed-run deadline are stored separately under `aaism-book:v3:practice`. The timer continues to count while the tab is closed.

Progress stays in that browser and does not travel inside the downloaded HTML file. Storage-disabled/private browsing still permits reading and practice for the current session. **Reset practice** clears choices and the timer after confirmation; **Start over** changes reading position. Neither sends data anywhere. The learning-record download lets you keep your choices and add your own reasoning.

## Contents

| Part | Chapters |
|---|---|
| Orientation | 1–2 · exam scope and conditional scenario reasoning |
| Foundations | 3–8 · office analogy, terminology, fit, models, lifecycle and deployment |
| Governance | 9–14 · roles, policy, inventory, program, enterprise risk and response |
| Risk | 15–19 · scenarios, assessments, threats, AI-enabled attacks and suppliers |
| Technologies and controls | 20–27 · architecture, agents, gates, data, privacy, explanations, monitoring and tools |
| Frameworks and context | 28–29 · dated instruments and clearly labelled forecasts |
| Preparation | 30–31 · adaptive study plan and original practice form |
| Supporting material | diagrams, case/analogy index, glossary, coverage map and source notes |

## Maintaining the material

The published artifact is `index.html`. Runtime JavaScript and CSS are embedded; authoring files add no runtime dependencies.

- `content/chapters.json`: learning objectives, Calder cases, recall questions/answers and chapter sources.
- `content/practice.json`: questions, choice explanations, answers and coverage tags.
- `content/sources.json`: dated references and their limitations.
- `content/visuals/*.svg`: original editable study illustrations. `content/visuals.json` records their captions, teaching locations and text alternatives; the build embeds them in matching `visual` marker blocks.
- `scripts/reader.js` and `scripts/reader.css`: reader and practice behavior/styles.
- `scripts/build.py`: embeds these sources into marked regions of the book using Python's standard library.

Figure captions and text-alternative labels are numbered in reading order during the build. Existing figure anchor IDs stay stable. When adding an illustration, add its SVG and manifest record, place a matching `<!-- BEGIN visual ID -->` / `<!-- END visual ID -->` block beside the teaching passage, then rebuild. Keep diagram labels legible at the 720-pixel minimum viewing width and supply a complete text equivalent.

After editing authoring sources:

```bash
python3 scripts/build.py
python3 -m unittest discover -s tests -v
```

Browser checks are in `tests/browser.cjs` and require Playwright plus Chromium as development tools. See that file for configuration. They are not required to read the guide. CI checks the authoring data and that rebuilding leaves the committed HTML unchanged.

The [original review](REVIEW-2026-10-20.md) describes the previous v2.x commit. [CHANGELOG.md](CHANGELOG.md) records the resulting corrections and improvements. Historical review line links refer to the reviewed commit rather than the current edition.

## Sources, independence and sharing

The guide uses the [public AAISM outline](https://www.isaca.org/credentialing/aaism/aaism-exam-content-outline), primary research, regulators, standards catalogue descriptions and identified historical reports. Verify current eligibility, exam logistics and obligations with their authoritative sources. ISO overviews do not reproduce or claim a full clause-level review of paid standards. Fictional examples and thresholds are explicitly teaching assumptions.

Not affiliated with, endorsed by, licensed by or produced with ISACA. AAISM, CISM, CISA, CRISC and COBIT are ISACA trademarks used to identify the subject. The practice questions are original; they do not reproduce confidential exam items.

Shared under [Creative Commons Attribution–NonCommercial–ShareAlike 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Credit the original project, retain the independence statement and source notes, use adaptations noncommercially and share them under the same licence. Corrections with primary references are welcome.
