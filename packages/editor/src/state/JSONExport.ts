import { runInAction } from "mobx";
import { ProjectJSON } from "../models/Project";
import { projectState } from "./ProjectState";

const filePickerOptions = {
  types: [
    {
      description: "JSON File",
      accept: {
        "application/json": [".json"],
      },
    },
  ],
};

export async function exportToJSON() {
  const fileHandle = await showSaveFilePicker(filePickerOptions);
  const projectJSON = projectState.toProjectJSON();
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(projectJSON));
  await writable.close();
}

export async function importJSON() {
  const [fileHandle] = await showOpenFilePicker(filePickerOptions);
  const data = await (await fileHandle.getFile()).text();
  const projectJSON = ProjectJSON.parse(JSON.parse(data));

  runInAction(() => {
    projectState.loadProjectJSON(projectJSON);
  });
}
