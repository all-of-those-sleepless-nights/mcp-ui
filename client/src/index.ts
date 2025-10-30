const SET_GLOBALS_EVENT_TYPE = 'openai:set_globals';

type UnknownRecord = Record<string, unknown>;

type WidgetData = {
  title?: string;
};

type OpenAiHandle = {
  toolInput?: UnknownRecord | null;
  toolOutput?: UnknownRecord | null;
};

type SetGlobalsEvent = CustomEvent<{ globals: Partial<OpenAiHandle> }>;

declare global {
  interface Window {
    openai?: OpenAiHandle;
  }

  interface WindowEventMap {
    [SET_GLOBALS_EVENT_TYPE]: SetGlobalsEvent;
  }
}

const DEFAULT_TITLE = 'Black widget ready';

const container = document.getElementById('black-root');
const titleEl = document.getElementById('black-title');

if (!container || !titleEl) {
  throw new Error('Black widget root not found');
}

type GlobalsCandidate = Partial<OpenAiHandle> & { widgetState?: UnknownRecord | null };

const readInitialConfig = (): WidgetData => {
  const raw = container.getAttribute('data-black-config');
  if (!raw || raw === '__BLACK_CONFIG_JSON__') {
    return {};
  }

  try {
    return JSON.parse(raw.replace(/&quot;/g, '"')) as WidgetData;
  } catch (error) {
    console.error('Failed to parse black widget config:', error);
    return {};
  }
};

const trimTitle = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const applyTitle = (value: unknown, fallbackToDefault = true) => {
  const next = trimTitle(value) ?? (fallbackToDefault ? DEFAULT_TITLE : undefined);
  if (!next) return;
  if (titleEl.textContent !== next) {
    titleEl.textContent = next;
  }
};

const extractWidgetData = (toolOutput: unknown): WidgetData | undefined => {
  if (!toolOutput || typeof toolOutput !== 'object') return undefined;
  const container = toolOutput as {
    widgetData?: unknown;
    _meta?: { widgetData?: unknown };
    toolResult?: { _meta?: { widgetData?: unknown } };
  };

  const direct = container.widgetData ?? container._meta?.widgetData ?? container.toolResult?._meta?.widgetData;
  if (direct && typeof direct === 'object') {
    return direct as WidgetData;
  }
  return undefined;
};

const resolveTitleFromGlobals = (globals?: GlobalsCandidate): string | undefined => {
  if (!globals) return undefined;
  const widget = extractWidgetData(globals.toolOutput);
  if (widget?.title) {
    return widget.title;
  }
  const fromInput = trimTitle((globals.toolInput as WidgetData | undefined)?.title);
  return fromInput;
};

const refreshFromOpenAi = () => {
  const globals = window.openai as GlobalsCandidate | undefined;
  const candidate = resolveTitleFromGlobals(globals) ?? readInitialConfig().title;
  applyTitle(candidate, true);
};

const waitForOpenAi = () => {
  if (typeof window.openai === 'object' && window.openai !== null) {
    refreshFromOpenAi();
    return;
  }

  const poll = window.setInterval(() => {
    if (typeof window.openai === 'object' && window.openai !== null) {
      window.clearInterval(poll);
      refreshFromOpenAi();
    }
  }, 250);
};

window.addEventListener(SET_GLOBALS_EVENT_TYPE, (event: Event) => {
  const globals = (event as SetGlobalsEvent).detail.globals;
  const title = resolveTitleFromGlobals(globals);
  if (title) {
    applyTitle(title);
  }
});

const initialConfig = readInitialConfig();
if (typeof initialConfig.title === 'string') {
  applyTitle(initialConfig.title, false);
}
waitForOpenAi();
