# 𝗄𝐚𝗀𝐚𝗆𝐢-𝗇𝐨-𝗆𝐢𝗀𝐚𝗄𝐚 · grid workbench version 1

The chosen display title is Kagami-no-Migaka and its exact description is かがみのしきしのみがか. The selected repository is `lilyofashwood/kagami-no-migaka`. The former title かのとこよ ⇄ よことのか is preserved in README poetry as a supplied kana reversal pair, not a palindrome; its intentional kanji readings are separate from the reversal. This specification keeps its existing `kasane-uta.*` document identifiers for compatibility; display naming does not change either wire format.

The recovered 5×5 Kasaneuta source and the supplied Kitsune artifact support the default tategaki and migi-yokogaki traversals below. The initial implementation selected these same paths before the fuller source arrived; the [geometry recovery note](evening-recovery-2026-09-10.md) records the corrected coordinate evidence. Earlier 4×4 and five-row, four-column experiments remain distinct from this fixed 5×5 document format.

## Grid document

`version` is `kasane-uta.grid.v1`. `grid` is an array of five rows, each five strings. Each cell contains one Unicode extended grapheme cluster, segmented with `Intl.Segmenter('ja', {granularity:'grapheme'})`. Lone surrogates, whitespace-only cells, mark-only cells, control characters and format controls other than ZWJ reject. Combining marks, supplementary kanji, emoji ZWJ sequences and variation selectors are preserved without normalization. Grapheme segmentation depends on the runtime’s Unicode version.

`paths` maps 2–8 ASCII names to lists of 25 unique `[row,column]` coordinates. Coordinates are integers 0–4. Each path visits every cell exactly once; the paths must differ. Literal readings concatenate exact cell strings in that order, with no implicit punctuation, whitespace, transliteration or language-model fill.

Default `tategaki`: visit columns right-to-left, each top-to-bottom. Default `migi_yokogaki`: visit rows top-to-bottom, each right-to-left. Both reproduce the exact source-backed Nekomata and Kitsune specimen readings; this mechanical correspondence does not independently verify the literary glosses. Custom complete paths can be supplied explicitly.

The receipt verifies positions and literal characters. It does not prove literary quality, intended semantics, historical authenticity, or an arbitrary message recovered from polysemy.

## Model candidate contract

Construction receives user intents, constraints and locally validated paths. It returns a grid plus optional literal readings and interpretations. The workbench uses its original paths, validates all cells, and rejects claimed literal readings that differ from actual traversal. Interpretations remain labelled model proposals. Deconstruction always obtains local literal strings before asking a provider to interpret.

No credentials appear in grid documents. Model calls are explicit, one at a time, with an output-token ceiling and timeout. No live calls or automatic repair loops are implied by offline tests.

## Optional exact-byte envelope version 1

`exactPayload` is an optional separate object:

```json
{"version":"kasane-uta.utf8-hex.v1","length":0,"hexadecimal":"","crc32":"00000000"}
```

`hexadecimal` is lowercase, even-length hex for exact UTF-8 payload bytes, maximum 1 MiB. `length` is byte count. `crc32` is eight lowercase hex digits of CRC32/ISO-HDLC over payload bytes (reflected polynomial `0xedb88320`, initial/final XOR `0xffffffff`). Strict UTF-8 is required after verifying length and CRC. An empty payload is valid.

The envelope is a new companion format, not a hidden historical kanji channel. It recovers independently of the poetic strings. The CRC detects corruption, not adversarial changes; the grid itself is not checksum-bound to the envelope. Invalid grid structure rejects before envelope recovery to keep the document coherent.
