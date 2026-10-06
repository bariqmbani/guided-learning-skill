# Why These Onboarding Questions

Reviewed 2026-10-06. These are design recommendations inferred from learning research. The research supports teaching principles; it does not validate this exact chatbot flow, its question count, a 20-minute session, or the skill as a complete intervention.

## Evidence behind the decisions

| Research finding | Design implication |
| --- | --- |
| Prior knowledge, the learning task, and goals affect how instructional strategies work. Meaningful goals and learner agency matter for motivation. [National Academies, *How People Learn II*, 2018, conclusions 5-1, 5-4, 6-2](https://www.nationalacademies.org/read/24783/chapter/2) | Ask for an actionable outcome and starting knowledge per topic. Make goals provisional and editable; use brief task evidence to adjust support. |
| The evidence reviewed did not justify assigning learners a style and matching instruction to that style. [Pashler et al., *Learning Styles: Concepts and Evidence*, 2008](https://doi.org/10.1111/j.1539-6053.2009.01038.x) | Remove the required style survey. Respect presentation preferences and access needs without treating them as fixed traits or guarantees. |
| Practice testing and distributed practice received high utility ratings across the reviewed contexts; feedback improves the usefulness of practice testing. [Dunlosky et al., 2013](https://doi.org/10.1177/1529100612453266) ([full paper](https://acs.ist.psu.edu/ist521/dunloskyRMNW13.pdf)) | Keep attempts, feedback, and later recall in the lesson method. Ask about realistic opportunities to return; don't ask learners to choose these from an extras catalog. |
| A systematic review of applied school and classroom research found benefits from retrieval practice across varied settings. [Agarwal, Nunes, and Blunt, 2021](https://doi.org/10.1007/s10648-021-09595-9) | Use retrieval in real lessons, with feedback. Classroom findings are useful guidance, not direct validation of an adult learning chatbot. |
| The guide recommends combining worked examples with problem solving, graphics with verbal descriptions, and reducing worked examples as expertise grows. It rates pre-questions less strongly than retrieval quizzes. [IES practice guide, 2007](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) | Choose representations for the task. Use a brief starting probe to calibrate teaching, then adapt scaffolding from actual attempts. Don't claim the probe itself guarantees better learning. |

Language, time, tools, and accommodations are practical design inputs here. Asking them lets the tutor produce lessons the learner can use; these sources do not establish a causal benefit from asking any particular wording. Offering all editable profile fields one question at a time, with skips and early completion, is a usability choice that needs real-user evaluation. Optional fields should be offered explicitly instead of relying on learners to volunteer them.

## Which answers earn a question

| Question | When | What changes |
| --- | --- | --- |
| Preferred teaching language or bilingual mix? | First vault setup, unless explicitly known | Explanations, questions, lesson notes, terminology. |
| Preferred name or nickname? | Optional during guided onboarding | How the tutor addresses the learner. This is a conversational preference, not a claim of improved learning. |
| General experience and interests? | Optional during guided onboarding | Familiar examples and analogies; does not establish topic mastery. |
| Broad aims and personal, work, or research context? | Optional during guided onboarding | Default relevance and audience; each topic still gets its own concrete outcome. |
| Typical session time? | Vault setup; reuse until changed | Scope and number of activities; split heavy concepts. |
| Explanation and activity preferences? | Optional during guided onboarding | Adjustable presentation and aid priorities, without assigning learner types or making practice conditional on selection. |
| Constraints or explicit preferences? | Optional at setup; clarify only when relevant | Usable formats, tools, chunks, and examples. |
| What should you be able to do, and for what purpose? | Each new topic | Roadmap scope, application tasks, success demonstration. |
| What have you tried, and where do you get stuck? | Each new topic | Provisional starting point, prerequisite checks, support. |
| When can you return for practice or review? | Each new topic; optional | Feasible amount of new learning and review. |
| Did pace, difficulty, or examples need adjustment? | After an early lesson, if not already answered | One concrete teaching adjustment; not a mastery score. |

All profile questions are optional, including language and time. Offer a name or nickname, general background, and goals without demanding identifying details. Do not require a degree, job title, demographics, diagnosis, personality quiz, motivation score, or full extras catalog. Ask relevant follow-ups to clarify teaching choices, preserve skipped values, and accept an early finish. Every invitation should explain or demonstrate how an answer can affect the lesson.

## Public release and evaluation

Keep this setup repository separate from learner vaults. Generate an empty starter with `scripts/create_vault.py`; it copies an explicit asset allowlist, creates an unconfigured profile and empty registry, and retains the license. Learner courses, profiles, and session history are never copied into a fresh setup. Deleting working files does not erase earlier Git commits; publish new starters with fresh history when that boundary is required.

Observe whether new users reach a first task, whether their saved answers alter teaching, whether language and access constraints are followed, and whether they can independently explain or perform the target task later. Invite usability feedback, but distinguish preference and completion from learning evidence. Delayed recall and a new application example offer more useful learning checks than satisfaction alone.

Existing profiles remain readable; no new schema or mandatory personal fields are introduced. Existing course plans, checklists, notes, and recall dates are preserved. Empty aid priorities mean the tutor can select useful methods; explicit exclusions belong in the text preferences.

The 3/7/21-day recall schedule remains a pragmatic starting heuristic. Completing it does not prove permanent retention, and no single interval sequence is optimal for every task or learner. A deployment with an LLM tutor also needs observation of explanation accuracy and feedback quality; the cited research is not evidence that the model assesses mastery reliably.
