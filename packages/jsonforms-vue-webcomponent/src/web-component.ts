import { type App, defineCustomElement } from 'vue';
import VanillaJsonForms from './web-components/VanillaJsonForms.ce.vue';
import VuetifyJsonForms from './web-components/VuetifyJsonForms.ce.vue';

import { styles } from './styles';

const VuetifyJsonFormsElement = defineCustomElement(VuetifyJsonForms, {
  shadowRoot: true, // Ensure shadow DOM is used
  configureApp: (app: App) => {
    // provide dummy usehead to disable injection of theme css with id vuetify-theme-stylesheet
    app.provide('usehead', {
      push(getHead: () => {}) {
        return {
          patch(getHead: () => {}) {},
        };
      },
    });
  },
  styles,
});

const VanillaJsonFormsElement = defineCustomElement(VanillaJsonForms, {
  shadowRoot: true, // Ensure shadow DOM is used
});

if (!customElements.get('vue-vanilla-jsonforms')) {
  customElements.define('vue-vanilla-jsonforms', VanillaJsonFormsElement);
}
if (!customElements.get('vue-vuetify-jsonforms')) {
  customElements.define('vue-vuetify-jsonforms', VuetifyJsonFormsElement);
}
