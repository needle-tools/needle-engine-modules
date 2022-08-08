import { TypeStore } from "@needle-tools/engine/engine/engine_typestore"

// Import types
import { DriveApi } from "../DriveApi.ts";
import { DriveClient } from "../DriveClient.ts";
import { LoadedGLTF } from "../DriveFileAccess.ts";
import { FilePromise } from "../DriveFileAccess.ts";
import { DriveFileAccess } from "../DriveFileAccess.ts";
import { DriveFileMeta } from "../DriveFileMeta.ts";
import { DriveFilePicker } from "../DriveFilePicker.ts";
import { DriveModelFileManager } from "../DriveModelFileManager.ts";
import { DriveShareDialogue } from "../DriveShareDialogue.ts";
import { FileCancellation } from "../FileCancellation.ts";
import { ModelUtils } from "../ModelUtils.ts";
import { ScreenshotUtils } from "../ScreenshotUtils.ts";
import { DriveNetworking } from "../networking/DriveNetworking.ts";
import { UserOpenedFileModel } from "../networking/DriveSyncedFile.ts";
import { RequiresAccessModel } from "../networking/DriveSyncedFile.ts";
import { GainedAccessModel } from "../networking/DriveSyncedFile.ts";
import { DriveSyncedFile } from "../networking/DriveSyncedFile.ts";
import { DriveSyncedUserModel } from "../networking/DriveSyncedUser.ts";
import { DriveSyncedUser } from "../networking/DriveSyncedUser.ts";
import { DriveUIComponent } from "../ui/DriveUIComponent.ts";

// Register types
TypeStore.add("DriveApi", DriveApi);
TypeStore.add("DriveClient", DriveClient);
TypeStore.add("LoadedGLTF", LoadedGLTF);
TypeStore.add("FilePromise", FilePromise);
TypeStore.add("DriveFileAccess", DriveFileAccess);
TypeStore.add("DriveFileMeta", DriveFileMeta);
TypeStore.add("DriveFilePicker", DriveFilePicker);
TypeStore.add("DriveModelFileManager", DriveModelFileManager);
TypeStore.add("DriveShareDialogue", DriveShareDialogue);
TypeStore.add("FileCancellation", FileCancellation);
TypeStore.add("ModelUtils", ModelUtils);
TypeStore.add("ScreenshotUtils", ScreenshotUtils);
TypeStore.add("DriveNetworking", DriveNetworking);
TypeStore.add("UserOpenedFileModel", UserOpenedFileModel);
TypeStore.add("RequiresAccessModel", RequiresAccessModel);
TypeStore.add("GainedAccessModel", GainedAccessModel);
TypeStore.add("DriveSyncedFile", DriveSyncedFile);
TypeStore.add("DriveSyncedUserModel", DriveSyncedUserModel);
TypeStore.add("DriveSyncedUser", DriveSyncedUser);
TypeStore.add("DriveUIComponent", DriveUIComponent);
