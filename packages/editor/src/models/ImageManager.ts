import { imageFromURL } from "../utils/Blob";
import { Buffer } from "buffer";
import { trpc } from "../state/trpc";
import { encode } from "url-safe-base64";
import { observable } from "mobx";

interface Image {
  width: number;
  height: number;
  dataURL: string;
}

export class ImageManager {
  readonly images = observable.map<string, Image>();

  constructor() {
    trpc?.onImageAdded.subscribe(undefined, {
      onData: async (entry) => {
        const img = await imageFromURL(entry.dataURL);
        this.images.set(entry.hash, {
          width: img.width,
          height: img.height,
          dataURL: entry.dataURL,
        });
      },
    });
  }

  // TODO: load images from server

  async insertDataURL(dataURL: string) {
    const blob = await (await fetch(dataURL)).blob();
    const buffer = await blob.arrayBuffer();

    // get hash of blob
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    const hashBase64 = encode(Buffer.from(hash).toString("base64"));

    const img = await imageFromURL(dataURL);

    await trpc?.insertImage.mutate({
      entry: {
        hash: hashBase64,
        dataURL,
      },
    });

    this.images.set(hashBase64, {
      width: img.width,
      height: img.height,
      dataURL,
    });

    return hashBase64;
  }

  get(hashBase64: string): Image | undefined {
    return this.images.get(hashBase64);
  }
}
