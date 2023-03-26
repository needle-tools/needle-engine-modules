import { TypeStore } from "@needle-tools/engine"

// Import types
import { CameraTracker } from "../CameraTracker";
import { Pathtracing } from "../Pathtracing";

// Register types
TypeStore.add("CameraTracker", CameraTracker);
TypeStore.add("Pathtracing", Pathtracing);
