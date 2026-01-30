I will implement the "Logical Sinking" and "3D Clay Atomic Task" with the specific constraints you provided:

### 1. Update Protocol Configuration (`src/config/protocolConfig.ts`)
*   **Target**: `chibify-3d-clay` protocol.
*   **Action**: Add `texture` parameter (Select: `Smooth`, `Handmade`, `Matte`).

### 2. Create PayloadBuilder Service (`src/services/PayloadBuilder.ts`)
*   **Structure**: `buildPayload(protocolId, inputValues, assetBuffer, slotConfig)` -> `{ endpoint, payload }`
*   **Strength Logic (Strict)**:
    *   For `chibify-3d-clay` (Flux): Explicitly map the input `strength` to the API's `strength` field. Ensure it is NOT mapped to `guidance_scale`.
    *   For Qwen: Continue mapping to `guidance_scale`.
*   **Prompt Engineering (High Priority)**:
    *   **Texture Mapping**: Map `Smooth` -> "smooth finish", `Handmade` -> "visible fingerprints, handcrafted", etc.
    *   **Placement**: Prepend texture keywords to the **front** of the prompt to ensure high weight.
    *   **Fusion**: Construct `FinalPrompt = "${TextureKeywords}, ${UserPrompt}, ${StyleSuffix}"`.

### 3. Refactor P4LabPage (`src/pages/P4LabPage.tsx`)
*   **Slimming**: Remove payload logic from `handleRealRun`. Use `PayloadBuilder`.
*   **Audit Logging**:
    *   Capture the return value of `PayloadBuilder`.
    *   `console.log('[Payload Audit] URL:', endpoint, 'Body:', payload)`.
    *   This ensures verification of `.com` vs `.cn` and the exact Prompt content.

### 4. Execution Order
1.  `protocolConfig.ts`
2.  `PayloadBuilder.ts`
3.  `P4LabPage.tsx`
