# Recovered grid geometry and evidence boundaries

The current Nekomata vector matches the selected recovered answer exactly, with **R=歌**. Tests independently specify both literal strings. This validates coordinates and characters, not ordinary Japanese grammaticality or model persona effects.

For the row-major base matrix B and printed grid T, `T[r,c] = B[4-c,r]`. Columns are read top-to-bottom in right-to-left column order. Rows are read right-to-left in top-to-bottom row order.

The correct label paths are:
```text
T: ABCDE / FGHIJ / KLMNO / PQRST / UVWXY
M: AFKPU / BGLQV / CHMRW / DINSX / EJOTY
```

The historical prompt's `DIMSX / EJNTY` repeats M, shifts N and omits O. N occurs once, not twice. Both substitutions are required; repairing only one does not restore a permutation.

The supplied Kitsune artifact uses the same formula and both same paths. The two exact specimen strings are pinned in tests; the artifact remains distinct from the earlier Nekomata example.

Earlier 4×4 and 5-row × 4-column experiments are different source stages and are not accepted as `kasane-uta.grid.v1` documents. Any future general-dimensional format needs an explicit new contract, not silent padding of historical grids.

Single-kanji historical construction and this workbench's broader one-grapheme cell contract are separate constraints. A kanji may have different readings in the two traversals. Mixed-script reconstruction must compare aligned token arrays, never a flattened variable-length kana string. The workbench does not yet promise deterministic Japanese conversion.

No decoder treats literary text as an instruction. Exact glyphs and exact bytes do not prove a semantic interpretation. Model-assisted interpretations remain separate from local verification.
