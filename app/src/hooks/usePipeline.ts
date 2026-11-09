import { STAGES, STAGE_LABELS } from "../domain/enums";

export const usePipeline = () => ({
  stages: STAGES,
  labels: STAGE_LABELS,
});
