<svelte:options
  customElement={{
    tag: 'svelte-flowbite-jsonforms',
    shadow: {
      mode: 'open',
    },
    props: {
      ajvOptions: {
        attribute: 'ajv-options',
      },
      validationMode: {
        attribute: 'validation-mode',
      },
      additionalErrors: {
        attribute: 'additional-errors',
      },
      customStyle: {
        attribute: 'custom-style',
      },
    },
  }}
/>

<script lang="ts">
  import { type JsonFormsChangeEvent, type JsonFormsProps } from '@chobantonov/jsonforms-svelte';
  import { createAjv, JsonForms, type ActionEvent } from '@chobantonov/jsonforms-svelte-extended';
  import { flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
  import { flowbiteExtendedRenderers } from '@chobantonov/jsonforms-svelte-flowbite-extended';
  import { defaultMiddleware, type JsonFormsI18nState } from '@jsonforms/core';
  import type { ErrorObject, Options } from 'ajv';
  import { Card, ThemeProvider, type ThemeConfig } from 'flowbite-svelte';
  import {
    dispatchHostEvent,
    normalizeSchema,
    parseBoolean,
    parseJson,
    parseMode,
    type JsonInput,
  } from './common';
  import { createTranslator } from './i18n';
  import baseStyles from './flowbite-webcomponent.css?inline';

  interface FlowbiteJsonFormsProps {
    data?: JsonInput;
    schema?: JsonInput;
    uischema?: JsonInput;
    uischemas?: JsonInput;
    config?: JsonInput;
    ajvOptions?: JsonInput;
    readonly?: boolean | string;
    validationMode?: JsonFormsProps['validationMode'];
    locale?: string;
    mode?: boolean | string;
    theme?: string;
    translations?: JsonInput;
    additionalErrors?: JsonInput;
    customStyle?: string;
  }

  const renderers = [...flowbiteRenderers, ...flowbiteExtendedRenderers];

  let {
    data = undefined,
    schema = undefined,
    uischema = undefined,
    uischemas = undefined,
    config = {},
    ajvOptions = undefined,
    readonly = false,
    validationMode = 'ValidateAndShow',
    locale = 'en',
    mode = 'system',
    theme = 'sunset',
    translations = undefined,
    additionalErrors = [],
    customStyle = '',
  }: FlowbiteJsonFormsProps = $props();

  let rootElement: HTMLDivElement | null = null;
  let formContainer: HTMLDivElement | null = null;
  let prefersDark = $state(false);
  let firstChangeDispatched = $state(false);
  let mediaQuery: MediaQueryList | null = null;

  const shadowBaseStyleId = 'jsonforms-svelte-flowbite-base-style';
  const shadowCustomStyleId = 'jsonforms-svelte-flowbite-custom-style';
  const hostElement = $host();

  const parsedData = $derived.by(() => {
    if (typeof data !== 'string') {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  });

  const parsedSchema = $derived(normalizeSchema(parseJson(schema, undefined)));
  const parsedUiSchema = $derived(parseJson(uischema, undefined));
  const parsedUiSchemas = $derived(parseJson(uischemas, []));
  const parsedConfig = $derived(parseJson(config, undefined));
  const parsedAjvOptions = $derived(parseJson(ajvOptions, undefined as Options | undefined));
  const parsedTranslations = $derived(parseJson(translations, undefined));

  const parsedAdditionalErrors = $derived.by(() => {
    const direct = parseJson(additionalErrors, undefined as ErrorObject[] | undefined);
    return direct ?? [];
  });

  const i18n = $derived.by((): JsonFormsI18nState => {
    return {
      locale,
      translate: createTranslator(locale, parsedTranslations),
    };
  });

  const ajv = $derived.by(() => {
    void parsedAjvOptions;
    return createAjv(() => i18n);
  });

  const dispatchChangeEvent = (event: JsonFormsChangeEvent) => {
    dispatchHostEvent(hostElement instanceof HTMLElement ? hostElement : null, 'change', event);
  };

  const handleChange = (event: JsonFormsChangeEvent) => {
    if (!firstChangeDispatched) {
      firstChangeDispatched = true;
      setTimeout(() => dispatchChangeEvent(event), 0);
      return;
    }

    dispatchChangeEvent(event);
  };

  const handleAction = async (event: ActionEvent) => {
    dispatchHostEvent(
      hostElement instanceof HTMLElement ? hostElement : null,
      'handle-action',
      event,
    );
  };

  const effectiveMode = $derived(parseMode(mode));
  const effectiveDark = $derived.by(() => {
    if (effectiveMode === 'dark') return true;
    if (effectiveMode === 'light') return false;
    return prefersDark;
  });
  const effectiveTheme = $derived.by(() => {
    const normalized = typeof theme === 'string' ? theme.trim() : '';
    return normalized || 'sunset';
  });

  $effect(() => {
    if (typeof window === 'undefined') return;

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDark = mediaQuery.matches;

    const onChange = (event: MediaQueryListEvent) => {
      prefersDark = event.matches;
    };
    mediaQuery.addEventListener('change', onChange);

    return () => mediaQuery?.removeEventListener('change', onChange);
  });

  $effect(() => {
    if (!(hostElement instanceof HTMLElement)) return;
    hostElement.setAttribute('data-theme-color', effectiveTheme);
    hostElement.setAttribute('data-mode', effectiveMode);
  });

  $effect(() => {
    const rootNode = rootElement?.getRootNode();
    if (!(rootNode instanceof ShadowRoot)) return;

    let shadowBaseStyleTag = rootNode.getElementById(shadowBaseStyleId) as HTMLStyleElement | null;
    if (!shadowBaseStyleTag) {
      shadowBaseStyleTag = document.createElement('style');
      shadowBaseStyleTag.id = shadowBaseStyleId;
      rootNode.prepend(shadowBaseStyleTag);
    }
    if (shadowBaseStyleTag.textContent !== baseStyles) {
      shadowBaseStyleTag.textContent = baseStyles;
    }

    let shadowCustomStyleTag = rootNode.getElementById(
      shadowCustomStyleId,
    ) as HTMLStyleElement | null;
    const nextCustomStyle = customStyle?.trim() ?? '';

    if (!nextCustomStyle) {
      shadowCustomStyleTag?.remove();
      return;
    }

    if (!shadowCustomStyleTag) {
      shadowCustomStyleTag = document.createElement('style');
      shadowCustomStyleTag.id = shadowCustomStyleId;
      rootNode.append(shadowCustomStyleTag);
    }

    if (shadowCustomStyleTag.textContent !== nextCustomStyle) {
      shadowCustomStyleTag.textContent = nextCustomStyle;
    }
  });

  $effect(() => {
    if (!formContainer) return;
    formContainer.classList.toggle('dark', effectiveDark);
  });

  const flowbiteTheme: ThemeConfig = {
    input: {
      base: 'group',
      close:
        'end-2 rtl:!right-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity',
    },
    search: {
      base: 'group',
      close:
        'end-2 rtl:!right-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity',
    },
    select: {
      base: 'group',
      close:
        'end-8 rtl:!right-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity',
    },
    textarea: {
      div: 'group',
      close:
        'end-2 rtl:!right-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity',
    },
    listGroupItem:
      "[&[aria-current='true']]:dark:bg-primary-700 [&[aria-current='true']]:dark:text-white",
  };
</script>

<div bind:this={rootElement} data-theme-color={effectiveTheme} data-mode={effectiveMode}>
  <div bind:this={formContainer}>
    <ThemeProvider theme={flowbiteTheme}>
      <Card class="min-w-full rounded-none border-0 bg-gray-50 p-0 shadow-none dark:bg-gray-800">
        <JsonForms
          data={parsedData}
          schema={parsedSchema}
          uischema={parsedUiSchema}
          uischemas={parsedUiSchemas}
          config={parsedConfig}
          readonly={parseBoolean(readonly, false)}
          {validationMode}
          {i18n}
          {renderers}
          cells={[]}
          {ajv}
          additionalErrors={parsedAdditionalErrors}
          middleware={defaultMiddleware}
          onchange={handleChange}
          onhandleaction={handleAction}
        />
      </Card>
    </ThemeProvider>
  </div>
</div>
