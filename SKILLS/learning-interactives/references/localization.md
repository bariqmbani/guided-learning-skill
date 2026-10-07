# Localize an activity

Set the page's `lang` (and `dir="rtl"` when appropriate), translate its lesson
markup and model labels, then provide the runtime's messages **before** loading
`interactive.js`. Keep the shared runtime unchanged; the normal build embeds
this configuration with the page for offline delivery.

```html
<html lang="id">
<!-- lesson markup -->
<script>
window.LearningUIStrings = {
  locale: 'id-ID',
  messages: {
    'theme.dark': 'Mode gelap',
    'theme.light': 'Mode terang',
    'theme.switchDark': 'Gunakan mode gelap',
    'theme.switchLight': 'Gunakan mode terang',
    'question.correct': 'Tepat. {feedback}',
    'question.retry': 'Coba tinjau lagi. {feedback}',
    'question.choose': 'Pilih jawaban, lalu periksa alasanmu.',
    'question.evidence': 'Gunakan bukti di atas untuk menjelaskan pilihanmu.'
  }
};
</script>
<script src="interactive.js"></script>
<!-- lesson script follows -->
```

This is a partial example: translate every key used by the selected components,
including their accessibility labels and announcements. Missing, empty, or
non-string messages fall back individually to English. Unknown keys are ignored.
The configuration is copied at initialization; it is not a live language switch.
Placeholders such as `{feedback}` may move within a sentence; preserve their
names and include the required information. All substitutions are plain text,
including answers that contain markup. Use complete sentences, rather than
assuming another language uses English word order or plural suffixes.

`locale` is an optional BCP 47 tag used for `fmt` numbers, percentages, and numeric
message placeholders. Omit it to retain browser number formatting; an invalid tag
also falls back to the browser. Locale does not translate messages or set the HTML
language. Supply both singular and plural terms when calling `fmt.count`; its
English `singular + 's'` convenience is inappropriate for other languages.

For a targeted view of the English defaults, read only the selected key families:

```sh
rg "^    '(theme|question)\." interactive.js
```

In a browser, `LearningUI.i18n.defaults` is a frozen dictionary of all supported
keys. `LearningUI.i18n.text(key, values)` returns a formatted message and throws
for an unknown key; lesson-specific prose belongs in the lesson source.

## Keys by component

Translate the common `theme` family and the families your activity uses. The
names in braces are available placeholders; entries without braces are plain
text. Chart-generated tables need `table.show` as well as the `chart` family.

| Family | Keys (prefix every name with the family and a dot) |
|---|---|
| `theme` | `dark`, `light`, `switchDark`, `switchLight` |
| `stepper` | `reducedMotion`, `pause`, `replay`, `play`, `position` {current, total}, `scrub` {current, total}, `announce` {position, summary}, `finished` {position} |
| `question` | `choose`, `correct` {feedback}, `retry` {feedback}, `evidence` |
| `quiz` | `position` {current, total}, `summary` {correct, total}, `complete`, `choose`, `correct` {feedback}, `retry` {feedback}, `evidence`, `seeSummary`, `next`, `restarted` |
| `answer` | `choose`, `label`, `record` {label, answer}, `recorded` — used by `mountPrediction` |
| `hints` | `first`, `next`, `shown` {shown, total}, `available` {total}, `announce` {current, hint} |
| `explain` | `minimum` {minimum, length}, `count` {length}, `write`, `compare`, `revealed` |
| `order` | `moved` {label, position, total}, `earlier` {label, position}, `later` {label, position}, `correct`, `retry`, `complete`, `partial` {placed, total, feedback}, `evidence`, `shuffled` |
| `matching` | `label` {term}, `choose`, `correct`, `retry`, `incomplete` {correct, answered}, `complete`, `partial` {correct, total, feedback}, `evidence` |
| `math` | `root` {index} — indexed-root linear text; other mathematical symbols stay notation |
| `chart` | `caption` {y, x}, `description` {caption, series, cursor}, `seriesSeparator`, `cursorDescription`, `baseline`, `cursorHint`, `data`, `series` |
| `table` | `show` |
| `bars` | `reference`, `category`, `value` |

`chart.seriesSeparator` and `chart.cursorDescription` include any surrounding
spaces needed when combined with `chart.description`. Author-provided labels,
feedback, hints, captions, button markup, and custom announcements remain the
author's responsibility. Math expressions and developer error messages are not
translated. If notation needs a spoken translation, pass `label` to `math.tex`
or set `data-math-label` in the lesson.

Before delivery, exercise unanswered, incorrect, correct, retry, reset, and
completed states in the target language. Check theme controls, chart table
captions, keyboard labels, live announcements, and longer translated text at
narrow widths. Verify the final standalone file offline.
