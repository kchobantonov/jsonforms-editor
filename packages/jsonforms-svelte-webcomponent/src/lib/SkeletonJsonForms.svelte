<svelte:options
  customElement={{
    tag: 'svelte-skeleton-jsonforms',
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
  import {
    PortalTargetContextSymbol,
    skeletonRenderers,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { skeletonExtendedRenderers } from '@chobantonov/jsonforms-svelte-skeleton-extended';
  import { defaultMiddleware, type JsonFormsI18nState } from '@jsonforms/core';
  import type { ErrorObject, Options } from 'ajv';
  import { setContext } from 'svelte';
  import {
    dispatchHostEvent,
    normalizeSchema,
    parseBoolean,
    parseJson,
    parseMode,
    type JsonInput,
  } from './common';
  import { createTranslator } from './i18n';
  import baseStyles from './skeleton-webcomponent.css?inline';

  interface SkeletonJsonFormsProps {
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

  const renderers = [...skeletonRenderers, ...skeletonExtendedRenderers];

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
    theme = 'cerberus',
    translations = undefined,
    additionalErrors = [],
    customStyle = '',
  }: SkeletonJsonFormsProps = $props();

  let rootElement: HTMLDivElement | null = null;
  let formContainer = $state<HTMLDivElement | null>(null);
  let firstChangeDispatched = $state(false);

  const shadowBaseStyleId = 'jsonforms-svelte-skeleton-base-style';
  const shadowCustomStyleId = 'jsonforms-svelte-skeleton-custom-style';
  const hostElement = $host();
  setContext(PortalTargetContextSymbol, () => formContainer);

  // Theme vars are generated under `[data-theme=...]` selectors. Portaled overlays
  // can render outside the themed wrapper, so also scope those selectors to `:host(...)`.
  const baseStylesWithHostThemes = baseStyles.replace(
    /(^|,)\s*(\[data-theme=[^\]]+\])/gm,
    '$1 :host($2), $2',
  );

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
  const effectiveTheme = $derived.by(() => {
    const normalized = typeof theme === 'string' ? theme.trim() : '';
    return normalized || 'cerberus';
  });

  $effect(() => {
    if (!(hostElement instanceof HTMLElement)) return;
    hostElement.setAttribute('data-theme', effectiveTheme);
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
    if (shadowBaseStyleTag.textContent !== baseStylesWithHostThemes) {
      shadowBaseStyleTag.textContent = baseStylesWithHostThemes;
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
</script>

<div
  bind:this={rootElement}
  class="preset-surface-50-950 min-w-full overflow-visible"
  data-theme={effectiveTheme}
  data-mode={effectiveMode}
>
  <div bind:this={formContainer}>
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
  </div>
</div>
