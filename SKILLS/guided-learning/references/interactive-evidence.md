# Interactive learning: research and design rationale

This note explains the reusable kit's design choices. It is a targeted review of
primary research and accessibility guidance, not a systematic review, a survey
of learner demand, or evidence that these exact templates improve learning.
Research contexts differ from an individual tutor conversation; check accuracy,
usability, learner explanations, transfer, and later recall rather than treating
engagement or clicks as learning outcomes.

## Research findings and our interpretation

| Source and finding | Design choice in this kit | Limit of the inference |
| --- | --- | --- |
| PhET studies describe simulation design that supports exploration through affordances, constraints, cues, and feedback; the implicit-scaffolding paper illustrates its framework with learner interviews around an energy simulation. | Start with a useful state, a few bounded controls, visible consequences, and optional prompts. Avoid making an interface tutorial the learner's first task. | This is design research in science/mathematics contexts, not proof that any slider-based page improves learning. [Podolefsky, Moore & Perkins, 2013/2014](https://arxiv.org/abs/1306.6544). |
| PhET describes iterative development that includes individual think-aloud interviews and research into how simulations are used. | Treat the first generated page as a design to inspect and adapt; attend to where the learner becomes confused about the interface. | Reusing a pattern does not reproduce PhET's research or validation process. [PhET research overview](https://phet.colorado.edu/en/research). |
| In two narrated-animation experiments about lightning, learner-controlled pacing produced better transfer performance in the reported comparisons, without a retention advantage. | Provide finite steps, Back/Next, replay, and optional playback so learners can inspect state changes. | This supports investigating pacing, not “animation is always better,” nor a guarantee for algorithms, other learners, or this implementation. [Mayer & Chandler, 2001](https://tecfa.unige.ch/tecfa/teaching/methodo/Mayer_Chandler01.pdf). |
| In two experiments using science texts, retrieval practice outperformed elaborative study with concept mapping on later conceptual tests, including inference questions. | Follow inspection with an explanation from memory or a new-case task; keep feedback tied to reasoning. | An immediate multiple-choice check is not equivalent to the studied retrieval procedure. The results do not imply that concept maps are useless or that a correct click proves retention. [Karpicke & Blunt, 2011](https://learninglab.psych.purdue.edu/downloads/2011/2011_Karpicke_Blunt_Science.pdf). |
| In a physics course comparing modes of presenting classroom demonstrations, students who predicted the outcome before seeing it showed better understanding than students who only watched, and passive observers did no better than students who saw no demonstration. | The prediction component records an answer before the evidence is shown, and the kit's templates ask for a prediction before the first manipulation. | This studied lecture demonstrations in one physics course, not simulations, individual tutoring, or these templates. The kit does not block exploration behind a prediction. [Crouch, Fagen, Callan & Mazur, 2004](https://mazur.harvard.edu/research-areas/classroom-demonstrations). |

The kit's **warm up → explore → explain → transfer** sequence combines these
ideas into a practical authoring routine. That exact sequence, ten-template
taxonomy, visual style, and code have not been experimentally evaluated here.
An initial answer can give the learner a starting point to compare with what
they observe, but it is not a mandatory gate to using controls. Exploration
should leave room for the learner's own questions.

Animations should make a relevant transition inspectable. More animation,
decorative motion, game points, or a longer session are not assumed to produce
more learning. A well-chosen static diagram can be sufficient, particularly when
the concept does not depend on change, motion is inaccessible, or a build would
consume time better spent on practice.

## Access requirements and implementation choices

W3C's Understanding documents explain WCAG criteria; the criteria and their
conformance levels should not be confused with this kit's additional preferences.
The checklist is guidance for authoring and testing, not a certification.

| Guidance | Application |
| --- | --- |
| ARIA roles do not implement keyboard interaction. Authors must provide the promised behavior. | Prefer native buttons, inputs, selects, fieldsets, and disclosures; add ARIA only for a real semantic/state need. Test controls rather than assuming a role makes them accessible. [WAI-ARIA APG, Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/). |
| WCAG 2.3.3, Level AAA, addresses disabling nonessential motion triggered by interaction. | Honor reduced-motion preferences in CSS and JavaScript; retain manual steps and readable states. Do not call all motion prohibited under AA. [Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). |
| WCAG 2.2.2, Level A, covers specified moving/auto-updating content and mechanisms to pause, stop, or hide it. | Use no automatic playback on page load, finite sequences, and a working Pause button. These are kit defaults that simplify the experience beyond case-by-case minimum requirements. [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html). |
| WCAG 2.5.8, Level AA, sets a 24-by-24 CSS-pixel minimum pointer target criterion with spacing and other exceptions. | Prefer larger, roughly 44-pixel controls with room between them; do not label 44 pixels as the AA minimum. [Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). |
| WCAG 1.1.1, Level A, calls for alternatives for non-text content, with context-dependent requirements. | A chart has an accessible name, a short interpretation, and underlying data. A process can be read as a state table or ordered explanation. A tooltip alone is insufficient for the kit's learning goals. [Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html). |
| WCAG 1.4.10, Level AA, addresses reflow without losing information or functionality, with exceptions for content requiring two-dimensional layout. | Stack controls on narrow screens, allow text to wrap, and confine wide-table scrolling to the table region. Verify zoom and reading order. [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). |
| MathML is the browser's own language for mathematics; it has been available in every major engine since January 2023, lays expressions out with a math font, and exposes their structure to assistive technology. | Equations compile to MathML rather than to images, monospace text, or a layout library, so notation is selectable, scalable, and spoken as mathematics. Where MathML is unavailable the same expression falls back to linear notation in a math face. | Support is wide but not universal, and screen-reader quality for mathematics varies by product. Rendering notation correctly does not make the mathematics correct. [MDN MathML reference](https://developer.mozilla.org/en-US/docs/Web/MathML). |
| W3C's complex-images tutorial asks for a short description next to the image and a full text alternative, such as the underlying data, nearby on the page. | Every chart has a name, a one-sentence interpretation written by the lesson, a keyboard-reachable value readout, and a data table in a disclosure. Bar figures are built from real text rather than from drawing primitives. | A table beside a chart satisfies the alternative; it does not make the chart itself understandable to every reader, and it is not a substitute for testing with the tools a learner actually uses. [Complex images](https://www.w3.org/WAI/tutorials/images/complex/). |

Provide redundant labels or patterns for colored states, visible focus, and
concise feedback. Check browser/assistive-technology combinations when possible;
native semantics reduce implementation burden but do not eliminate testing.
Access needs should shape the activity itself, not just a fallback sentence.

## Candidate learner requests and pattern coverage

The taxonomy below is an authoring analysis: plausible tasks across course
subjects, not a claim about measured frequency or an exhaustive catalog of
everything learners will request. Several subjects can use the same interaction
mechanism. Choose by the thinking task, then adapt the content.

| Thinking task | Candidate requests | Starting pattern | What the learner should produce |
| --- | --- | --- | --- |
| Explore a relationship | “Show how slope changes the line”; “What does changing a threshold do?”; “How does resistance affect current?” | Parameter explorer | An initial answer plus an explanation of what changed and what stayed fixed |
| Trace state over time | “Walk through binary search”; “Show the message flow”; “Explain each step in this derivation” | Step sequence | The next state and the rule responsible for the transition |
| Compare alternatives | “When does compounding matter?”; “Compare caching strategies”; “Which claim follows from which assumptions?” | Comparison | A conditional choice using shared criteria, including a boundary case |
| Reason about uncertainty | “Why is a small sample unstable?”; “How do trials approach an expected rate?”; “How would this queue behave?” | Probability lab | A distinction between a model expectation, a particular sample, and variability |
| Decide and justify | “What should I inspect next?”; “How would you respond in this scenario?”; “Which sentence fits this context?” | Decision scenario | A reason for a choice and a revised decision after seeing consequences |
| Retrieve from memory | “Quiz me on the mechanism”; “Test whether I still know this”; “Give me practice questions” | Practice set | An independent answer, then an explanation in the learner's own words |
| Construct or sequence | “Help me arrange this process”; “Put these steps in order”; “Which step comes first?” | Order the steps | An order plus the rule that forces it, not a remembered sequence |
| Inspect relationships among many items | “Show the dependencies”; “Explain a causal diagram”; “How are these ideas connected?” | System map | A relationship explained in words, with direction and assumptions explicit |
| Read data honestly | “What does this table actually say?”; “Why do these two summaries disagree?” | Data explorer | A claim the data supports, and a named limit it does not |
| Justify a formula or construction | “Why is that formula true?”; “Show me where this comes from” | Geometry lab | An argument about the quantities, not a restatement of the formula |
| Classify or match | “Let me practice identifying examples”; “Match each term to its definition” | Matching or question component within a relevant pattern | A rationale for each pairing; use a new case after feedback |

Templates cover reusable structure, not domain verification. A Bayesian
simulation, physical model, medical case, or financial scenario needs its own
appropriate sources and assumptions. Specialized numerical or spatial demands
may need a locally bundled dependency; decide from the capability gap, not from
the subject label. For a purely verbal distinction, a short conversation or
comparison table may be more useful than a custom interactive.

## References

- Podolefsky, N. S., Moore, E. B., & Perkins, K. K. (2013; revised 2014).
  *Implicit scaffolding in interactive simulations: Design strategies to support
  multiple educational goals.* [Author preprint](https://arxiv.org/abs/1306.6544).
- PhET Interactive Simulations, University of Colorado Boulder.
  [Research and development overview](https://phet.colorado.edu/en/research).
- Mayer, R. E., & Chandler, P. (2001). *When learning is just a click away: Does
  simple user interaction foster deeper understanding of multimedia messages?*
  Journal of Educational Psychology, 93(2), 390–397.
  [Paper](https://tecfa.unige.ch/tecfa/teaching/methodo/Mayer_Chandler01.pdf),
  [DOI](https://doi.org/10.1037/0022-0663.93.2.390).
- Karpicke, J. D., & Blunt, J. R. (2011). *Retrieval practice produces more
  learning than elaborative studying with concept mapping.* Science, 331(6018),
  772–775. [Author-hosted paper](https://learninglab.psych.purdue.edu/downloads/2011/2011_Karpicke_Blunt_Science.pdf),
  [DOI](https://doi.org/10.1126/science.1199327).
- Crouch, C. H., Fagen, A. P., Callan, J. P., & Mazur, E. (2004). *Classroom
  demonstrations: Learning tools or entertainment?* American Journal of Physics,
  72(6), 835–838. [Research summary](https://mazur.harvard.edu/research-areas/classroom-demonstrations),
  [DOI](https://doi.org/10.1119/1.1707018).
- W3C Web Accessibility Initiative. [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/),
  the [complex images tutorial](https://www.w3.org/WAI/tutorials/images/complex/),
  and the WCAG 2.2 Understanding pages linked above.
- MDN Web Docs. [MathML reference](https://developer.mozilla.org/en-US/docs/Web/MathML)
  for the notation the kit emits and its browser availability.

See the kit guide at `SKILLS/guided-learning/interactives/README.md` for templates,
adaptation boundaries, and the delivery checklist, and
`SKILLS/guided-learning/interactives/COMPONENTS.md` for each component's contract.
