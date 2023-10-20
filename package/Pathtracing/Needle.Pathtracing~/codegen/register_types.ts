import { TypeStore } from "@needle-tools/engine"

// Import types
import { CameraTracker } from "../CameraTracker.js";
import { Pathtracing } from "../Pathtracing.js";

// Register types
TypeStore.add("CameraTracker", CameraTracker);
TypeStore.add("Pathtracing", Pathtracing);
