<template>
  <Suspense>
    <div>
      <dynamic-element tag="style" type="text/css">
        {{ customStyleToUse }}
      </dynamic-element>

      <div style="height: 400px" v-if="error !== undefined">
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
          "
        >
          <div style="font-size: 1.1rem; color: red; width: 100%">
            {{ error }}
          </div>
        </div>
      </div>

      <template v-else>
        <json-forms
          :data="state.data"
          :schema="state.schema"
          :uischema="state.uischema"
          :uischemas="state.uischemas"
          :readonly="state.readonly"
          :validation-mode="state.validationMode"
          :config="state.config"
          :additional-errors="state.additionalErrors"
          :i18n="state.i18n"
          :renderers="state.renderers"
          @change="onChange"
        ></json-forms>
      </template>
    </div>
  </Suspense>
</template>

<script lang="ts">
import DynamicElement from '@/components/DynamicElement.vue';
import { createTranslator } from '@/i18n/i18n';
import { useAppStore } from '@/store';
import {
  createAjv,
  defaultMiddleware,
  type JsonFormsUISchemaRegistryEntry,
  type Translator,
  type ValidationMode,
} from '@jsonforms/core';
import { JsonForms } from '@jsonforms/vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import isPlainObject from 'lodash/isPlainObject';
import {
  computed,
  defineComponent,
  getCurrentInstance,
  markRaw,
  onMounted,
  type PropType,
  reactive,
  ref,
  watch,
} from 'vue';
import { extractAndInjectFonts } from '../util/inject-fonts';

const toBoolean = (val: any): boolean | undefined => {
  if (typeof val === 'string') {
    return val === 'true';
  }

  if (typeof val === 'boolean') {
    return val;
  }

  return undefined;
};

export default defineComponent({
  name: 'VuetifyJsonForms',
  components: {
    JsonForms,
    DynamicElement,
  },
  emits: ['change'],
  props: {
    data: { type: [Object, String, Number, Array, null] as any }, // remove Boolean since it is a specially treated by the webcomponent
    schema: {
      type: [Object, String] as any,
      validator: (value: any) => {
        try {
          const obj = typeof value === 'string' ? JSON.parse(value) : value;
          return obj == null || isPlainObject(obj);
        } catch {
          return false;
        }
      },
    },
    uischema: {
      type: [Object, String] as any,
      validator: (value: any) => {
        try {
          const obj = typeof value === 'string' ? JSON.parse(value) : value;
          return obj == null || isPlainObject(obj);
        } catch {
          return false;
        }
      },
    },
    config: {
      type: [Object, String] as any,
      validator: (value: any) => {
        try {
          const obj = typeof value === 'string' ? JSON.parse(value) : value;
          return obj == null || isPlainObject(obj);
        } catch {
          return false;
        }
      },
    },
    ajvOptions: {
      type: [Object, String] as any,
      validator: (value: any) => {
        try {
          const obj = typeof value === 'string' ? JSON.parse(value) : value;
          return obj == null || isPlainObject(obj);
        } catch {
          return false;
        }
      },
    },
    uischemas: {
      type: [Array, String] as any,
      validator: (value: any) => {
        try {
          const obj = typeof value === 'string' ? JSON.parse(value) : value;
          return obj == null || Array.isArray(obj);
        } catch {
          return false;
        }
      },
    },
    translations: {
      type: [Object, String] as any,
      validator: (value: any) => {
        try {
          const obj = typeof value === 'string' ? JSON.parse(value) : value;
          return obj == null || isPlainObject(obj);
        } catch {
          return false;
        }
      },
    },
    additionalErrors: {
      type: [Array, String] as any,
      validator: (value: any) => {
        try {
          const obj = typeof value === 'string' ? JSON.parse(value) : value;
          return obj == null || Array.isArray(obj);
        } catch {
          return false;
        }
      },
    },
    readonly: { type: String, default: 'false' },
    validationMode: {
      type: String as PropType<ValidationMode>,
      default: 'ValidateAndShow',
      validator: (v: string) =>
        v === 'ValidateAndShow' ||
        v === 'ValidateAndHide' ||
        v === 'NoValidation',
    },
    locale: { type: String, default: 'en' },
    customStyle: {
      type: String,
    },
  },
  setup(props, { emit }) {
    const normalize = (val: any) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    };

    const app = getCurrentInstance()?.appContext.app;

    const appStore = useAppStore({});

    appStore.locale = props.locale ?? 'en';

    const error = ref<string | undefined>(undefined);

    const dataNormalized = computed(() => normalize(props.data));
    const schemaNormalized = computed(() => {
      const s = normalize(props.schema);
      if (s && !s.$id) s.$id = '/';
      return s;
    });
    const uiSchemaNormalized = computed(() => normalize(props.uischema));
    const configNormalized = computed(() => normalize(props.config));
    const ajvOptionsNormalized = computed(() => normalize(props.ajvOptions));
    const translationsNormalized = computed(() =>
      normalize(props.translations)
    );
    const additionalErrorsNormalized = computed(
      () => normalize(props.additionalErrors) || []
    );
    const uischemasNormalized = computed<JsonFormsUISchemaRegistryEntry[]>(
      () => normalize(props.uischemas) || []
    );

    const i18nToUse = ref<{ locale: string; translate: Translator }>({
      locale: appStore.locale,
      translate: createTranslator(
        appStore.locale,
        translationsNormalized.value
      ),
    });

    const state = reactive({
      data: dataNormalized.value,
      schema: schemaNormalized.value,
      uischema: uiSchemaNormalized.value,
      renderers: markRaw(vanillaRenderers),
      cells: undefined,
      config: configNormalized.value,
      ajv: markRaw(createAjv(ajvOptionsNormalized.value)),
      readonly: toBoolean(props.readonly),
      uischemas: uischemasNormalized.value,
      validationMode: props.validationMode,
      i18n: i18nToUse.value,
      additionalErrors: additionalErrorsNormalized.value,
      middleware: defaultMiddleware,
    });

    const customStyleToUse = computed(() => props.customStyle);

    // ===== Watchers =====
    watch(dataNormalized, (v) => (state.data = v));
    watch(schemaNormalized, (v) => (state.schema = v), { deep: true });
    watch(uiSchemaNormalized, (v) => (state.uischema = v), { deep: true });
    watch(configNormalized, (v) => (state.config = v), { deep: true });
    watch(ajvOptionsNormalized, (v) => (state.ajv = markRaw(createAjv(v))), {
      deep: true,
    });
    watch(uischemasNormalized, (v) => (state.uischemas = v), { deep: true });
    watch(
      () => props.readonly,
      (v) => (state.readonly = toBoolean(v))
    );
    watch(
      () => props.validationMode,
      (v) => (state.validationMode = v as ValidationMode)
    );
    watch(
      translationsNormalized,
      (v) => {
        i18nToUse.value = {
          locale: appStore.locale,
          translate: createTranslator(appStore.locale, v),
        };
        state.i18n = i18nToUse.value;
      },
      { deep: true }
    );
    watch(additionalErrorsNormalized, (v) => (state.additionalErrors = v), {
      deep: true,
    });

    const onChange = (event: any) => {
      emit('change', event);
    };

    watch(
      () => props.locale,
      (v) => {
        appStore.locale = v ?? 'en';
        i18nToUse.value = {
          locale: appStore.locale,
          translate: createTranslator(
            appStore.locale,
            translationsNormalized.value
          ),
        };
        state.i18n = i18nToUse.value;
      }
    );

    const injectFontsStyle = (root: Node) => {
      // Inject all @font-face rules from component's styles and Vuetify theme
      extractAndInjectFonts(root, 'vue-vanilla-jsonforms-fonts');
    };

    const injectCustomFontsStyle = (css: string) => {
      extractAndInjectFonts(css, 'vue-vanilla-jsonforms-fonts-custom');
    };

    onMounted(() => {
      const vm = getCurrentInstance();

      const shadowRoot = vm?.vnode?.el?.getRootNode();

      injectFontsStyle(shadowRoot);
      if (customStyleToUse.value) {
        injectCustomFontsStyle(customStyleToUse.value);
      }
    });

    watch(customStyleToUse, (newCss) => {
      if (newCss) injectCustomFontsStyle(newCss);
    });

    return {
      appStore,
      customStyleToUse,
      state,
      error,
      onChange,
    };
  },
});
</script>
