# Recovered grid geometry

The Nekomata vector preserves the selected recovered answer exactly, with **R=歌**. Tests independently specify both literal strings and check every coordinate and character.

For the row-major base matrix B and printed grid T, `T[r,c] = B[4-c,r]`. Columns are read top-to-bottom in right-to-left column order. Rows are read right-to-left in top-to-bottom row order.

The correct label paths are:
```text
T: ABCDE / FGHIJ / KLMNO / PQRST / UVWXY
M: AFKPU / BGLQV / CHMRW / DINSX / EJOTY
```

The historical prompt’s `DIMSX / EJNTY` repeats M, shifts N and omits O. Both substitutions are required to restore a complete permutation.

The supplied Kitsune artifact uses the same formula and both paths. Its two specimen strings are pinned independently in tests.

Earlier 4×4 and 5-row × 4-column experiments use different dimensions. The `kasane-uta.grid.v1` contract takes exactly 5×5 cells; other dimensions belong in a separately versioned format.

Historical construction uses single kanji; the current workbench also accepts other complete graphemes. A kanji can take different readings along the two traversals. Mixed-script reconstruction compares aligned token arrays, keeping variable-length readings attached to their source cells. The workbench exposes exact glyph strings, with literary interpretation alongside them.
