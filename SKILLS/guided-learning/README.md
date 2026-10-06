# Guided Learning

Read [[Home|Home]] to start, or [[topics/README|Learning Topics]] to navigate.
The method uses a spiral curriculum, comprehension checks, and spaced recall.
Every subject has an independent roadmap and learning history.

The canonical instructions are in [SKILL.md](SKILL.md) and
[topic-routing.md](references/topic-routing.md). [PEDAGOGY.md](PEDAGOGY.md)
explains the method. This setup builds on the MIT-licensed
[WSE Research guided-learning skill](https://github.com/WSE-research/guided-learning-skill).

[Onboarding](references/onboarding.md) covers language, time, and optional
constraints. [Topic intake](references/topic-intake.md) sets a useful outcome and
starting point for each subject. [Research rationale](references/onboarding-evidence.md)
explains the evidence and limits of these design choices.

## Onboarding example

Run `$guided-learning onboard` in Codex, or `/guided-learning onboard` in Claude
Code. Answer the tutor's questions in your own words. You can also include your
answers in the first message:

```text
$guided-learning onboard

I prefer learning in Russian. A typical session can take about 20 minutes.
Please save these preferences for future learning sessions:

- Every explanation should include source references and links.
- Base explanations on verified facts. Distinguish established facts from
  uncertainty, inference, and illustrative examples. Do not invent references.
- Give one analogy for every new abstract concept, and explain where the
  analogy stops working.
- Use STE-style writing: short, direct sentences, familiar words, and defined
  technical terms. Apply these plain-language principles to Russian explanations.
- Give a practical challenge for every concept. Wait for my answer before
  giving feedback or revealing a solution.

Keep any existing profile fields I have not changed. This is onboarding only;
do not create a topic, start a lesson, or change any learning progress.
```

The tutor saves Russian as the teaching language, the session budget, and your
detailed requests in the learner profile. It summarizes the saved choices and
does not ask again for information you already supplied. Custom requests do not
need to fit a preset menu.

| Preference | How it changes a lesson |
| --- | --- |
| Russian | Explanations, questions, exercises, and new lesson prose use Russian. |
| References and facts | Explanations include relevant sources. Unverified claims and uncertainty are identified; references are never fabricated. |
| Analogy for each abstract concept | The tutor gives one analogy and states its limits. The analogy illustrates the concept; it is not evidence for a factual claim. |
| STE-style writing | The tutor uses short, direct sentences and explains technical terms. |
| Challenge for each concept | The tutor gives a task or question, waits for your attempt, then provides feedback. It can reuse the comprehension check rather than add a second exercise. |

Here, STE means [Simplified Technical English](https://www.asd-ste100.org/STE_faq.html).
STE is an English writing standard. For Russian, this example requests its
plain-language principles; it does not claim that Russian prose conforms to STE.

Onboarding updates only `learner-profile.json` and `Learner Profile.md`. These
preferences apply across topics, and you can change them later by running
onboarding again. To start a subject after setup, say:

```text
I want to learn probability so I can make better decisions under uncertainty.
I am starting from the basics and can return three times a week.
```

The tutor then records a separate plan for that topic and starts a useful lesson.
