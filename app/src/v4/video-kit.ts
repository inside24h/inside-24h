// Audit C3 (2026-11-12): everything the app needs only to MAKE a video or a share picture (plan, story, hooks,
// narration, facts, captions, sound, the recorder, the share card), gathered in one module so the hosted build
// loads it as its own chunk after the first screen (AppV4.tsx loadVideoKit: when the page is idle, or at once when
// Share is tapped) instead of in the first download. Re-exports only: no logic lives here.
export { narrationFor } from './video-narration';
export { arcFor, compareDiffs, compareFacts, factInOf, factLines } from './video-facts';
export { canEncode, captionOf, composeCmpFrame, composeCover, composeFrame, recordCompare, stampFor, record, recordFrames, saveFile, SIZE, VIDEO_COPY, videoSupportHere } from './share';
export { planVideo } from './video-plan';
export { beatCtx, CMP_SHORT, CMP_STOPS, cmpName, applyHook, climaxFx, heroOf, servingAmount, comparePlan, decafOf, gaugesAt, payoffMinOf, plainLatin, shortName, singleStops, surgeOf, surpriseOf } from './video-story';
export { compareHookB, hookB, hookFor, hookForCompare, seedOf } from './video-hook';
export { captionFlags, captionsFor, PLATFORM_CUT, PLATFORM_LABEL, PLATFORM_LENGTH, PLATFORMS } from './video-caption';
export { idleDrift, ORGAN_AT, project, SIDE_X, splitPose } from './video-cam';
export { bodyGlowAt, inText, isLightDrink, paletteAt, plainNote, plainSugar, SEG_FOCUS_V, whereCard } from './video-body';
export { drawMomentCard } from './shareCard';
export { srtOf } from './srt';
