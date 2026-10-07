## Onboarding example

Run `$learner-profile` in Codex, or `/learner-profile` in Claude
Code. The tutor guides you one question at a time through language, preferred
name, background, broad goals, learning context, session time, explanation style,
preferred activities, and other preferences. Every answer is optional: say
**skip**, **you choose**, or **finish**. You never need to edit JSON yourself.

When the host supports it, questions appear in its interactive question UI and
the tutor continues after each answer. Hosts without a usable question tool use
regular chat messages. The example below shows the wording of that conversation.

For example, the beginning of a guided conversation might be:

> **Tutor:** Which language would you like us to use? A bilingual mix is welcome.
>
> **Learner:** English.
>
> **Tutor:** We'll use English. What would you like me to call you? A nickname is fine, or we can skip.
>
> **Learner:** Skip.
>
> **Tutor:** Of course. What experience or interests could I use for familiar examples?
>
> **Learner:** I work on backend systems and enjoy cooking.
>
> **Tutor:** I'll draw on those for examples and explain where each analogy stops working. Broadly, what would you like learning to help you do?

The tutor continues through the remaining optional fields and finishes with a
short plan for how your answers will shape lessons. A saved profile can be
revisited to fill gaps; preferences already provided are preserved.

You can also supply preferences up front, or request only a specific update:

```text
$learner-profile

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
preferences apply across both learning skills, and you can change them later by running
onboarding again. To start a subject after setup, say:

```text
$guided-learning probability so I can make better decisions under uncertainty.
I am starting from the basics and can return three times a week.
```

The tutor then records a separate plan for that topic and starts a useful lesson.

For a focused lesson instead, use `$concept-learning bubble sort` or `/concept-learning bubble sort`.
