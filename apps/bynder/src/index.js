import pick from "lodash/pick";
import { setup } from "shared-dam-app";

import logo from "./logo.svg";

const CTA = "Select or upload a file on Bynder";

const FIELDS_TO_PERSIST = [
  "archive",
  "brandId",
  "copyright",
  "dateCreated",
  "dateModified",
  "datePublished",
  "description",
  "extension",
  "fileSize",
  "height",
  "id",
  "isPublic",
  "limited",
  "name",
  "orientation",
  "original",
  "thumbnails",
  "type",
  "watermarked",
  "width",
];

const validAssetTypes = ["image", "audio", "document", "video"];

function makeThumbnail(resource) {
  const thumbnail =
    (resource.thumbnails && resource.thumbnails.webimage) || resource.src;
  const url = typeof thumbnail === "string" ? thumbnail : undefined;
  const alt = [resource.id, ...(resource.tags || [])].join(", ");

  return [url, alt];
}

function prepareBynderHTML({ bynderURL, assetTypes }) {
  // let types = "";
  // if (!assetTypes) {
  //   // We deault to just images in this fallback since this is the behavior the App had in its initial release
  //   types = "image";
  // } else {
  //   types = assetTypes
  //     .trim()
  //     .split(",")
  //     .map((type) => type.trim())
  //     .join(",");
  // }

  return `
      <div
        style="height: 100vh"
        id="bynder-compactview"
      />
  `;
}

function onSuccess(assets, additionalInfo) {
  var importedAssetsContainer = document.getElementById("bynder-compactview");
  importedAssetsContainer.innerHTML = "";

  asset = selectedAssets[i];

  switch (asset.type) {
    case "IMAGE":
      importedAssetsContainer.innerHTML +=
        "<img src=" + additionalInfo.selectedFile.url + " />";
      break;
    case "AUDIO":
    case "DOCUMENT":
      importedAssetsContainer.innerHTML +=
        "<img src=" + asset.files.webImage.url + " />";
      break;
    case "VIDEO":
      importedAssetsContainer.innerHTML +=
        '<video width="640" height="480" controls>' +
        '<source src="' +
        asset.previewUrls[0] +
        '" type="video/webm">' +
        "</video>";
      break;
  }
}

function renderDialog(sdk) {
  const config = sdk.parameters.invocation;

  const container = document.createElement("div");
  container.innerHTML = prepareBynderHTML(config);
  document.body.appendChild(container);

  document.addEventListener("BynderAddMedia", (e) => {
    sdk.close(Array.isArray(e.detail) ? e.detail : []);
  });

  sdk.window.startAutoResizer();

  BynderCompactView.open({
    language: "en_US",
    mode: "SingleSelectFile",
    container: document.getElementById("bynder-compactview"),
    assetTypes: ["image", "audio", "document", "video"],
    onSuccess: onSuccess,
    portal: { url: "", editable: "" },
  });
}

async function openDialog(sdk, _currentValue, config) {
  const result = await sdk.dialogs.openCurrentApp({
    position: "center",
    title: CTA,
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    parameters: { ...config },
    width: 1400,
  });

  if (!Array.isArray(result)) {
    return [];
  }

  return result.map((item) => ({
    ...pick(item, FIELDS_TO_PERSIST),
    src: item.thumbnails && item.thumbnails.webimage,
  }));
}

function isDisabled() {
  return false;
}

function validateParameters({ bynderURL, assetTypes }) {
  const isHTMLSafe = ['"', "<", ">"].every(
    (unsafe) => !bynderURL.includes(unsafe)
  );

  if (!isHTMLSafe) {
    return "Provide a valid Bynder URL.";
  }

  const types = assetTypes
    .trim()
    .split(",")
    .map((type) => type.trim());
  const isAssetTypesValid = types.every((type) =>
    validAssetTypes.includes(type)
  );

  if (!isAssetTypesValid) {
    return `Only valid asset types may be selected: ${validAssetTypes.join(
      ","
    )}`;
  }

  return null;
}

setup({
  cta: CTA,
  name: "Bynder",
  logo,
  color: "#0af",
  description:
    "The Bynder app is a widget that allows editors to select media from their Bynder account. Select or upload a file on Bynder and designate the assets that you want your entry to reference.",
  parameterDefinitions: [
    {
      id: "bynderURL",
      type: "Symbol",
      name: "Bynder URL",
      description: "Provide Bynder URL of your account.",
      required: true,
    },
    {
      id: "assetTypes",
      type: "Symbol",
      name: "Asset types",
      description: "Choose which types of assets can be selected.",
      default: validAssetTypes.join(","),
      required: true,
    },
  ],
  makeThumbnail,
  renderDialog,
  openDialog,
  isDisabled,
  validateParameters,
});
