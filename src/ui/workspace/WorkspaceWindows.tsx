import {
  BarChart3,
  FolderOpen,
  HelpCircle,
  LineChart,
  ListChecks,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { AnalysisSelection, SpectrumDataset } from "../../domain/types";
import type { WindowLayout } from "../../store/projectTypes";
import type { ContextMenuItem } from "../ContextMenu";
import { useUserSettingsStore, type UserLocale } from "../Settings";
import { AnalysisControls } from "../windows/AnalysisControls";
import { BandDiagramWindow } from "../windows/BandDiagramWindow";
import { DataBrowser } from "../windows/DataBrowser";
import { DataTable } from "../windows/DataTable";
import { LEIPSEvacPlotWindow, LEIPSPlotWindow } from "../windows/LEIPSPlotWindow";
import { ProjectListWindow } from "../windows/ProjectListWindow";
import { REELSPlotWindow } from "../windows/REELSPlotWindow";
import {
  UPSBiasDependenceWindow,
  UPSIPPlotWindow,
  UPSVBPlotWindow,
} from "../windows/UPSPlotWindow";

export type AnalysisControlTab = "data" | "sample" | "ups" | "leips" | "reels" | "band" | "fit";

export function renderWindow(window: WindowLayout, analysisTab: AnalysisControlTab = "sample") {
  switch (window.kind) {
    case "browser":
      return <DataBrowser />;
    case "table":
      return <DataTable />;
    case "ups":
    case "ups-ip":
      return <UPSIPPlotWindow />;
    case "ups-vb":
      return <UPSVBPlotWindow />;
    case "ups-bias":
      return <UPSBiasDependenceWindow />;
    case "leips":
      return <LEIPSPlotWindow />;
    case "leips-evac":
      return <LEIPSEvacPlotWindow />;
    case "reels":
      return <REELSPlotWindow />;
    case "band":
      return <BandDiagramWindow />;
    case "controls":
      return <AnalysisControls activeTab={analysisTab} />;
    case "help":
      return <HelpWindow />;
    case "projects":
      return <ProjectListWindow />;
  }
}

export function iconForWindow(kind: WindowLayout["kind"]): ReactNode {
  switch (kind) {
    case "browser":
      return <FolderOpen size={14} />;
    case "table":
      return <Table2 size={14} />;
    case "ups":
    case "ups-vb":
    case "ups-ip":
    case "ups-bias":
    case "leips":
    case "leips-evac":
    case "reels":
      return <LineChart size={14} />;
    case "band":
      return <BarChart3 size={14} />;
    case "controls":
      return <SlidersHorizontal size={14} />;
    case "help":
      return <HelpCircle size={14} />;
    case "projects":
      return <ListChecks size={14} />;
  }
}

export function titleForWindow(
  window: WindowLayout,
  datasets: readonly SpectrumDataset[],
  selection: AnalysisSelection,
): string {
  switch (window.kind) {
    case "ups-vb":
      return appendDatasetName(window.title, datasets, selection.upsVbDatasetId);
    case "ups-ip":
    case "ups":
      return appendDatasetNames(window.title, datasets, selection.upsIpDatasetIds);
    case "leips":
    case "leips-evac":
      return appendDatasetName(window.title, datasets, selection.leipsDatasetId);
    case "reels":
      return appendDatasetName(window.title, datasets, selection.reelsDatasetId);
    default:
      return window.title;
  }
}

export function windowContextItems(
  window: WindowLayout,
  actions: {
    assignDataset: (slot: keyof AnalysisSelection, datasetId: string) => void;
    datasets: readonly SpectrumDataset[];
    recalculate: () => void;
    resetWindowPosition: (id: string) => void;
    resetWindowSize: (id: string) => void;
    selection: AnalysisSelection;
  },
): ContextMenuItem[] {
  const resetItems: ContextMenuItem[] = [
    { type: "separator" },
    {
      type: "item",
      label: "Reset window position",
      action: () => actions.resetWindowPosition(window.id),
    },
    {
      type: "item",
      label: "Reset window size",
      action: () => actions.resetWindowSize(window.id),
    },
  ];
  switch (window.kind) {
    case "browser":
    case "controls":
    case "table":
      return [{ type: "item", label: "Recalculate", action: actions.recalculate }, ...resetItems];
    case "ups-vb":
      return [
        datasetSubmenu("UPS VB dataset", "upsVbDatasetId", "ups-vb", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
        ...resetItems,
      ];
    case "ups":
    case "ups-ip":
      return [
        multiDatasetSubmenu("UPS IP datasets", "ups-ip", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
        ...resetItems,
      ];
    case "ups-bias":
      return [{ type: "item", label: "Recalculate", action: actions.recalculate }, ...resetItems];
    case "leips":
      return [
        datasetSubmenu("LEET dataset", "leetDatasetId", "leet", actions),
        datasetSubmenu("LEET(der) dataset", "leetDerDatasetId", "leet-der", actions),
        datasetSubmenu("LEIPS dataset", "leipsDatasetId", "leips", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
        ...resetItems,
      ];
    case "leips-evac":
      return [
        datasetSubmenu("LEIPS dataset", "leipsDatasetId", "leips", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
        ...resetItems,
      ];
    case "reels":
      return [
        datasetSubmenu("REELS dataset", "reelsDatasetId", "reels", actions),
        { type: "separator" },
        { type: "item", label: "Recalculate", action: actions.recalculate },
        ...resetItems,
      ];
    default:
      return resetItems.slice(1);
  }
}

function appendDatasetName(
  title: string,
  datasets: readonly SpectrumDataset[],
  datasetId: string | undefined,
): string {
  const datasetName = datasets.find((dataset) => dataset.id === datasetId)?.name;
  return datasetName ? `${title} - ${datasetName}` : title;
}

function appendDatasetNames(
  title: string,
  datasets: readonly SpectrumDataset[],
  datasetIds: readonly string[] | undefined,
): string {
  const names = (datasetIds ?? [])
    .map((datasetId) => datasets.find((dataset) => dataset.id === datasetId)?.name)
    .filter(Boolean);
  if (names.length === 0) {
    return title;
  }
  return `${title} - ${names.length === 1 ? names[0] : `${names.length} datasets`}`;
}

function datasetSubmenu(
  label: string,
  slot: keyof AnalysisSelection,
  kind: SpectrumDataset["kind"],
  actions: {
    assignDataset: (slot: keyof AnalysisSelection, datasetId: string) => void;
    datasets: readonly SpectrumDataset[];
    selection: AnalysisSelection;
  },
): ContextMenuItem {
  const datasets = actions.datasets.filter((dataset) => dataset.kind === kind);
  return {
    type: "submenu",
    label,
    items:
      datasets.length > 0
        ? datasets.map((dataset) => ({
            type: "item",
            label: dataset.id === actions.selection[slot] ? `${dataset.name} ✓` : dataset.name,
            action: () => actions.assignDataset(slot, dataset.id),
          }))
        : [{ type: "item", label: "No matching datasets", disabled: true }],
  };
}

function multiDatasetSubmenu(
  label: string,
  kind: SpectrumDataset["kind"],
  actions: {
    assignDataset: (slot: keyof AnalysisSelection, datasetId: string) => void;
    datasets: readonly SpectrumDataset[];
    selection: AnalysisSelection;
  },
): ContextMenuItem {
  const datasets = actions.datasets.filter((dataset) => dataset.kind === kind);
  const selected = new Set(actions.selection.upsIpDatasetIds ?? []);
  return {
    type: "submenu",
    label,
    items:
      datasets.length > 0
        ? datasets.map((dataset) => ({
            type: "item",
            label: selected.has(dataset.id) ? `${dataset.name} ✓` : dataset.name,
            action: () => actions.assignDataset("upsIpDatasetIds", dataset.id),
          }))
        : [{ type: "item", label: "No matching datasets", disabled: true }],
  };
}

type HelpTabId = "overview" | "data" | "ups" | "leips" | "band" | "reels" | "plot" | "shortcuts";

interface HelpTab {
  id: HelpTabId;
  label: string;
  title: string;
  sections: { heading: string; body: string[] }[];
}

function HelpWindow() {
  const locale = useUserSettingsStore((state) => state.locale);
  const tabs = helpTabsForLocale(locale);
  const [activeTabId, setActiveTabId] = useState<HelpTabId>("overview");
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]!;
  return (
    <div className="flex h-full flex-col bg-slate-100 text-sm text-slate-700">
      <div className="border-b border-slate-300 bg-slate-200 p-2">
        <div
          className="grid grid-cols-4 gap-1 text-[11px]"
          role="tablist"
          aria-label="Help sections"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab.id === tab.id}
              className={
                activeTab.id === tab.id
                  ? "rounded border border-slate-700 bg-slate-800 px-1.5 py-1 font-semibold text-white shadow-sm"
                  : "rounded border border-slate-300 bg-white px-1.5 py-1 text-slate-700 hover:bg-slate-100"
              }
              onClick={() => setActiveTabId(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-white p-4 text-xs leading-5">
        <h3 className="text-sm font-semibold text-slate-900">{activeTab.title}</h3>
        <div className="mt-4 space-y-4">
          {activeTab.sections.map((section) => (
            <section key={section.heading} className="space-y-1">
              <h4 className="font-semibold text-slate-900">{section.heading}</h4>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function helpTabsForLocale(locale: UserLocale): HelpTab[] {
  return locale === "en-US" ? EN_HELP_TABS : JA_HELP_TABS;
}

const JA_HELP_TABS: HelpTab[] = [
  {
    id: "overview",
    label: "概要",
    title: "解析の全体像",
    sections: [
      {
        heading: "基本の流れ",
        body: [
          "Catalogsで解析カタログを切り替え、Projectsでプロジェクトを保存・読み込みします。ProjectはCatalog内だけで独立して管理されます。",
          "CSVを読み込み、DataタブでUPS VB、UPS IP、LEET、LEET(der)、LEIPS、REELSの役割へ割り当てます。各plotでカーソルを調整し、UPS、LEIPS、REELS、Band Diagramの順で結果を確認します。",
        ],
      },
      {
        heading: "画面移動",
        body: [
          "View > Reset viewはworkspaceの表示位置と拡大率を初期化します。Windows menuではwindowを前面化するBring to frontと、表示中心へ移動するGo to positionを使い分けます。",
        ],
      },
    ],
  },
  {
    id: "data",
    label: "データ",
    title: "データロードとアサイン",
    sections: [
      {
        heading: "データのロード",
        body: [
          "Data BrowserのLoad CSVsからMultiPak CSVを読み込みます。ファイル名やCSVメタデータからUPS VB/IP、LEET、LEET(der)、LEIPS、REELSを自動推定します。",
          "推定が違う場合はData BrowserのdatasetメニューでChange roleを使います。role変更だけでは解析対象に自動追加されないため、Dataタブで明示的に割り当てます。",
        ],
      },
      {
        heading: "データのアサイン",
        body: [
          "DataタブでUPS VBは1つ、UPS IPは複数、LEIPS系はLEET/LEET(der)/LEIPSをそれぞれ選択します。REELSは1つのdatasetを選択します。",
          "Project保存・読み込み・import/exportでは、割り当て、カーソル、plot範囲、Sample情報が復元されます。",
        ],
      },
    ],
  },
  {
    id: "ups",
    label: "UPS",
    title: "UPS解析",
    sections: [
      {
        heading: "VB解析",
        body: [
          "UPS VB plotでVBM edgeとBGのカーソルを置きます。2本の線形fitの交点をVBMとして扱い、EF-VBMはその絶対値として表示します。",
          "カーソルはplot上でドラッグできます。Fitタブでは数値で範囲を編集できます。",
        ],
      },
      {
        heading: "IP解析",
        body: [
          "UPS IPは複数datasetを選択できます。各IP datasetごとに印加電圧、IP VBM、Cut-offのカーソル範囲、plot拡大状態を保持します。",
          "IP datasetではVBM側のedge/BGとCut-off側のedge/BGを合わせ、IgorProと同じ式 IP = hν - (Ecutoff - EVBM) でIPを算出します。",
        ],
      },
      {
        heading: "bias dependenceとIPの採用方法",
        body: [
          "UPS Bias DependenceはCutoff、EVBM、IPを印加電圧に対して別plotで表示します。近似直線から帯電の影響や0 V外挿値を確認します。",
          "Band Diagramで使うIPは、0V extrapolated、Average、または特定IP datasetから選びます。UPSタブとBandタブで現在のIP sourceと採用値を確認できます。",
        ],
      },
    ],
  },
  {
    id: "leips",
    label: "LEIPS",
    title: "LEIPS解析",
    sections: [
      {
        heading: "LEET(der)ピーク",
        body: [
          "LEIPS PlotではLEET(der)のピーク付近にpeak cursorを置きます。Gaussian fitでピーク位置Epeakを求めます。",
          "LEET、LEET(der)、LEIPSのannotationと、ピークからvacuum levelまでのband pass filter矢印を確認します。",
        ],
      },
      {
        heading: "バンドパスフィルター",
        body: [
          "右クリックメニューのFilterから装置のband pass filterを選択します。Customを選ぶと任意値を入力できます。",
          "Evac = Epeak + bandpassとして真空準位を決め、LEIPS vs Energy from Evac.へ変換します。",
        ],
      },
      {
        heading: "LEIPS fitting",
        body: [
          "LEIPS vs Energy from Evac.でCBM edgeとBGをfitし、交点をEAとして扱います。cursor styleやcursor range表示はplotごとに保存されます。",
        ],
      },
    ],
  },
  {
    id: "band",
    label: "Band",
    title: "Band Diagram確認",
    sections: [
      {
        heading: "UPS-LEIPS Band Diagram",
        body: [
          "Band DiagramはUPS VBとLEIPSをEf基準へ変換し、IP、EA、Egをannotationします。EgはBand Diagramで採用したIP sourceとEAから計算します。",
          "UPS/LEIPSの倍率、オフセット、X range、有効数字、annotation font、arrow sizeを調整できます。ダブルクリックやAutoで表示範囲を戻せます。",
        ],
      },
    ],
  },
  {
    id: "reels",
    label: "REELS",
    title: "REELS解析",
    sections: [
      {
        heading: "REELS解析",
        body: [
          "REELSはKinetic Energyを読み込み、Electron loss energy = incident energy - kinetic energyへ変換して表示します。",
          "onset edgeとBGをfitして交点をEg_REELSとして表示します。BGはfit rangeまたはsingle point y=constモードを選択できます。",
        ],
      },
    ],
  },
  {
    id: "plot",
    label: "描画",
    title: "UPS/LEIPS描画の調整",
    sections: [
      {
        heading: "plot調整",
        body: [
          "plot上のホイールはY方向zoom、Shift+ホイールはX方向zoom、Alt+ドラッグまたはAlt+ホイールはpanです。通常ドラッグは矩形zoom、ダブルクリックはplot zoom resetです。",
          "context menuからReset view、Copy PNG、Export PNG、Export SVGを実行できます。cursor rangeの表示・非表示やcursor styleもplotごとに切り替えます。",
        ],
      },
    ],
  },
  {
    id: "shortcuts",
    label: "操作",
    title: "ショートカットとメニュー",
    sections: [
      {
        heading: "メニュー操作",
        body: [
          "CatalogsはCatalog単位の切替・import/export、ProjectsはProject単位の保存・読み込み・rename・deleteを扱います。",
          "Windows menuはwindowの前面化、Go to position、位置・サイズreset、Help/Project Listの表示切替に使います。背景右クリックでも同じメニューを開けます。",
        ],
      },
    ],
  },
];

const EN_HELP_TABS: HelpTab[] = [
  {
    id: "overview",
    label: "Overview",
    title: "Analysis overview",
    sections: [
      {
        heading: "Workflow",
        body: [
          "Use Catalogs to switch analysis catalogs and Projects to save or load projects. Projects are isolated inside the active catalog.",
          "Load CSV files, assign datasets in the Data tab, adjust fit cursors in each plot, then review UPS, LEIPS, REELS, and the Band Diagram results.",
        ],
      },
      {
        heading: "Navigation",
        body: [
          "View > Reset view restores workspace pan and zoom. In Windows, Bring to front changes stacking order, while Go to position moves the workspace viewport so the selected window is centered.",
        ],
      },
    ],
  },
  {
    id: "data",
    label: "Data",
    title: "Load data and assign roles",
    sections: [
      {
        heading: "Load data",
        body: [
          "Use Load CSVs in Data Browser to import MultiPak CSV files. The app infers UPS VB/IP, LEET, LEET(der), LEIPS, and REELS from file names and CSV metadata.",
          "If the inferred role is wrong, use Change role from the dataset menu. Changing a role does not automatically select it for analysis; assign it explicitly in the Data tab.",
        ],
      },
      {
        heading: "Assign datasets",
        body: [
          "Select one UPS VB dataset, multiple UPS IP datasets, LEET/LEET(der)/LEIPS datasets, and one REELS dataset in the Data tab.",
          "Project save, load, import, and export restore dataset assignment, cursors, plot viewports, and Sample information.",
        ],
      },
    ],
  },
  {
    id: "ups",
    label: "UPS",
    title: "UPS analysis",
    sections: [
      {
        heading: "VB analysis",
        body: [
          "Place VBM edge and BG cursors in the UPS VB plot. The intersection of the two linear fits is treated as VBM, and EF-VBM is displayed as its absolute value.",
          "Cursors are draggable on the plot. The Fit tab also allows numeric range editing.",
        ],
      },
      {
        heading: "IP analysis",
        body: [
          "UPS IP supports multiple datasets. Each dataset stores its applied bias, IP VBM and Cut-off fit ranges, and plot viewport independently.",
          "Fit IP VBM edge/BG and Cut-off edge/BG on each IP dataset. The app uses the IgorPro-compatible formula IP = hν - (Ecutoff - EVBM).",
        ],
      },
      {
        heading: "Bias dependence and Choose IP source",
        body: [
          "UPS Bias Dependence plots Cutoff, EVBM, and IP against applied bias. Use the fitted line to check charging and the 0 V extrapolated value.",
          "Choose IP source for the Band Diagram from 0V extrapolated, Average, or a specific IP dataset. The UPS and Band tabs show the active source and adopted value.",
        ],
      },
    ],
  },
  {
    id: "leips",
    label: "LEIPS",
    title: "LEIPS analysis",
    sections: [
      {
        heading: "LEET(der) peak",
        body: [
          "Place the peak cursor around the LEET(der) peak in the LEIPS plot. A Gaussian fit determines Epeak.",
          "Check the LEET, LEET(der), and LEIPS annotations and the band-pass arrow from the peak to the vacuum level.",
        ],
      },
      {
        heading: "Band-pass filter",
        body: [
          "Choose the instrument band-pass filter from Filter in the context menu. Custom lets you enter an arbitrary value.",
          "The vacuum level is Evac = Epeak + bandpass, and the LEIPS data are transformed into LEIPS vs Energy from Evac.",
        ],
      },
      {
        heading: "LEIPS fitting",
        body: [
          "Fit CBM edge and BG in LEIPS vs Energy from Evac. The intersection is treated as EA. Cursor style and range visibility are saved per plot.",
        ],
      },
    ],
  },
  {
    id: "band",
    label: "Band",
    title: "Band Diagram review",
    sections: [
      {
        heading: "UPS-LEIPS Band Diagram",
        body: [
          "The Band Diagram converts UPS VB and LEIPS onto the Ef basis and annotates IP, EA, and Eg. Eg follows the selected IP source and EA.",
          "Adjust UPS/LEIPS scale, offsets, X range, significant digits, annotation font, and arrow size. Double-click or Auto restores the view range.",
        ],
      },
    ],
  },
  {
    id: "reels",
    label: "REELS",
    title: "REELS analysis",
    sections: [
      {
        heading: "REELS analysis",
        body: [
          "REELS reads Kinetic Energy and displays Electron loss energy = incident energy - kinetic energy.",
          "Fit onset edge and BG to obtain Eg_REELS. BG can use a fit range or the single point y=const mode.",
        ],
      },
    ],
  },
  {
    id: "plot",
    label: "Plot",
    title: "UPS/LEIPS plot adjustment",
    sections: [
      {
        heading: "Plot controls",
        body: [
          "Wheel zooms Y, Shift+wheel zooms X, Alt+drag or Alt+wheel pans, normal drag performs rectangular zoom, and double-click resets the plot zoom.",
          "Use the context menu for Reset view, Copy PNG, Export PNG, and Export SVG. Cursor range visibility and cursor style are also controlled per plot.",
        ],
      },
    ],
  },
  {
    id: "shortcuts",
    label: "Shortcuts",
    title: "Menus and shortcuts",
    sections: [
      {
        heading: "Menus",
        body: [
          "Catalogs handles catalog switching and catalog import/export. Projects handles project save, load, rename, import/export, and delete.",
          "Windows brings windows forward, runs Go to position, resets window geometry, and toggles Help or Project List. The background context menu exposes the same structure.",
        ],
      },
    ],
  },
];
