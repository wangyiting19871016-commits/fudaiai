# P4 工业化架构重构计划

## Phase 1: Physical Layer "Cleanup" (File Deletion Plan)

### 1.1 Duplicate Renderer Removal
- **Delete**: `src/components/SmartPreview.tsx` (replaced by UniversalPreview)
- **Delete**: `src/components/ImageRenderer.tsx` (WebGL-based, replaced by UniversalPreview)
- **Seal Temporarily**: `src/engines/ArtifactEngine.ts` (future WebGL engine, keep for GPU transition)

### 1.2 Verification Component Consolidation
- **Keep**: `src/components/VerifyPanel_Dynamic.tsx` (active component)
- **Delete**: `src/components/VerifyPanel.tsx` (outdated component)

### 1.3 Historical Residue Cleanup
- **Delete**: All `.bak`, `_New`, `_v2` files (including `src/pages/LabPage.tsx.bak`)
- **Delete**: `src/_legacy_archive_20251226` directory (no longer needed)

## Phase 2: Architecture Layer "Realignment" (Communication Refactoring)

### 2.1 Event Mechanism Abolition
- **Search & Remove**: All `window.dispatchEvent` and `window.addEventListener` related to P3/P4 communication
- **Files to Modify**: `src/pages/MissionFoundry/hooks/useMissionLogic.ts`, `src/pages/EditorPage.tsx`, `src/pages/MissionFoundry/components/ProtocolDrawer.tsx`

### 2.2 Context Strong Binding
- **P4 Publishing Side**: When publishing, call `MissionContext.dispatch({ type: 'OCCUPY_SLOT', ... })` to store 14 parameters in `slot.currentBenchmark.aestheticParams`
- **P3 Receiving Side**: Update `src/pages/MissionFoundry/components/AssetMatrix.tsx` to use `useContext(MissionContext)` and listen for slot state changes
- **Parameter Priority Simplification**: Refactor `UniversalPreview.tsx` to remove internal merging logic, prioritize `Context` or `Props` `aestheticParams` as first priority

## Phase 3: Logic Layer "Alignment" (Algorithm Interface Unification)

### 3.1 Create AestheticMapper Utility
- **File**: `src/utils/AestheticMapper.ts` (new)
- **HARD_NEUTRAL_MAP Definition**: Define mandatory neutral values to prevent black/white flashes
  ```typescript
  const HARD_NEUTRAL_MAP = {
    exposure: 0,
    saturation: 1, // Must be 1, not 0
    contrast: 1,   // Must be 1, not 0
    // Other parameters...
  };
  ```
- **Normalization/Denormalization Functions**: 
  - `normalizeParams(params)`: Convert UI values to algorithm range
  - `denormalizeParams(params)`: Convert algorithm values to UI range
  - `clampParams(params)`: Ensure values stay within valid bounds

### 3.2 Force Mapper Application
- **Update**: `src/components/UniversalPreview.tsx`
- **Change**: Process all rendering parameters through `AestheticMapper` before `processImageData`
- **Remove**: Manual division by 100 in pixel processing loops

## Phase 4: Verification Layer "Breakpoint Checking" (Regression Prevention)

### 4.1 Data Persistence Verification
- **Add Logging**: When publishing, log the 14-parameter object stored in MissionContext
- **Location**: `src/pages/P4LabPage.tsx` (publish button handler)

### 4.2 Rendering Feedback Verification
- **Ensure**: P3 page can invoke UniversalPreview with correct parameters
- **Test**: Verify color preservation with current 4-parameter algorithm

## Detailed Implementation Steps

### Step 1: File Deletion (Physical Cleanup)
1. Delete specified files and directories
2. Verify deletion by checking file system
3. Run build to ensure no compilation errors

### Step 2: Context Communication Refactoring
1. Update MissionContext to handle slot occupancy
2. Modify P4 publish logic to use Context dispatch
3. Update AssetMatrix to listen to Context changes
4. Simplify UniversalPreview parameter handling
5. Remove all event listeners and dispatchers

### Step 3: Parameter Mapping Implementation
1. Create AestheticMapper.ts with HARD_NEUTRAL_MAP
2. Implement normalization/denormalization functions
3. Update UniversalPreview to use mapper
4. Remove manual parameter scaling in pixel processing

### Step 4: Verification and Testing
1. Test P4 publish flow
2. Verify parameter persistence in Context
3. Test P3 preview rendering
4. Ensure no black/white flashing on initial load
5. Validate color preservation

## Key Risk Mitigation

### Neutral Value Protection
- **HARD_NEUTRAL_MAP**: Ensures saturation=1 and contrast=1 by default
- **Clamping**: All parameters clamped to valid ranges
- **Denormalization Safety**: Default values provided for missing parameters

### Parameter Priority
- **Simplified Logic**: No more complex merging in UniversalPreview
- **Clear Source**: Parameters come from either Context or Props, not both
- **No Overrides**: Prevent outdated default values from "washing" new data

### ArtifactEngine Preservation
- **Sealed**: Not deleted, kept for future GPU transition
- **No Usage**: Not imported or used in current codebase
- **Documented**: Marked as future WebGL engine

## Expected Outcomes

1. **Clean Codebase**: Reduced redundant files, improved maintainability
2. **Unified Communication**: Single Context-based data flow between P3/P4
3. **Consistent Rendering**: UniversalPreview used across all components
4. **Safe Parameter Handling**: No black/white flashing, proper neutral values
5. **Future-Proof**: ArtifactEngine preserved for WebGL transition
6. **Verifiable**: Logging ensures data persistence
7. **Color Preserved**: Proper parameter mapping maintains image colors