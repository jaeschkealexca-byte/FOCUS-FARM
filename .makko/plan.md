# Change: Smaller Stage 3 Melon and Eggplant

## Expected outcome
The third growth-stage visuals (`*_s3`, stage index 2) for melon and eggplant render smaller. Reduce only those stage-3 height caps by about 20% (melon: 84px → 67px; eggplant: 76px → 61px) (default — confirm or change). Keep their other growth stages, crop positions, and all other crops unchanged.

## Build plan
1. **What:** In `src/farm/crop-plot.ts`, change the stage-index-2 entries of `renderMelonStage()`'s `maxHeights` from 84 to 67 and `renderEggplantStage()`'s `maxHeights` from 76 to 61. Leave each neighboring stage cap and all other rendering code unchanged.
   **Files:** `src/farm/crop-plot.ts`
   **Verify:** In-game, grow or preview melon and eggplant at stages 2, 3, and 4: verify stage 3 is visibly smaller and remains bottom-aligned, while stages 2/4 and the sizes of other crops are unchanged.