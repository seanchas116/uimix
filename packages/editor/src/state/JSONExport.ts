import { runInAction } from "mobx";
import { DocumentJSON } from "uimix-node-data";
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
  const projectJSON = projectState.document.toJSON();
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(projectJSON));
  await writable.close();
}

export async function importJSON() {
  const [fileHandle] = await showOpenFilePicker(filePickerOptions);
  const data = await (await fileHandle.getFile()).text();
  const projectJSON = DocumentJSON.parse(JSON.parse(data));

  runInAction(() => {
    projectState.document.loadJSON(projectJSON);
  });
}
