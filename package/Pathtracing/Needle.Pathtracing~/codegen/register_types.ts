import { TypeStore } from "@needle-tools/engine"

// Import types
import { CameraTracker } from "../CameraTracker.js";
import { Pathtracing } from "../Pathtracing.js";
import { RealismEffects } from "../RealismEffects.js";

// Register types
TypeStore.add("CameraTracker", CameraTracker);
TypeStore.add("Pathtracing", Pathtracing);
TypeStore.add("RealismEffects", RealismEffects);
