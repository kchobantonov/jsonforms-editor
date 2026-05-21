import '../lib/webcomponent-entry';

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 3,
    },
    active: {
      type: 'boolean',
    },
  },
  required: ['name'],
};

const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/name',
    },
    {
      type: 'Control',
      scope: '#/properties/active',
    },
  ],
};

const data = {
  name: 'JSON Forms',
  active: true,
};

document.getElementById('app')!.innerHTML = `
  <div style="display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); padding: 24px;">
    <section>
      <h2>Svelte Skeleton</h2>
      <svelte-skeleton-jsonforms
        schema='${JSON.stringify(schema)}'
        uischema='${JSON.stringify(uischema)}'
        data='${JSON.stringify(data)}'
      ></svelte-skeleton-jsonforms>
    </section>
    <section>
      <h2>Svelte Flowbite</h2>
      <svelte-flowbite-jsonforms
        schema='${JSON.stringify(schema)}'
        uischema='${JSON.stringify(uischema)}'
        data='${JSON.stringify(data)}'
      ></svelte-flowbite-jsonforms>
    </section>
  </div>
`;
