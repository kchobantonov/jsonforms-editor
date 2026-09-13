import { fieldHelp } from "../inspector/help.js";
const help: Record<string, string> = {
  label:
    "Текст за този елемент. Оставете празно, за да се използва заглавието или името на полето.",
  action: "Идентификатор на действието при натискане на бутона.",
  height: "Височина на свободното пространство в пиксели.",
  src: "Адрес на изображението за показване.",
  alt: "Описание на изображението за потребители с екранен четец.",
  layoutType:
    "Подреждане на съществуващите вложени елементи вертикално или хоризонтално.",
  itemTypes: "Разрешени JSON типове за всеки елемент на масива. Изберете няколко типа за обединение.",
  schemaTypes:
    "Разрешени типове JSON стойности. Изберете няколко, за да допуснете например string и null.",
  schemaTitle:
    "Кратко заглавие на полето, използвано като етикет по подразбиране.",
  schemaDescription: "Обяснете предназначението на полето и как да се попълни.",
  schemaDefault:
    "Предложена стойност при липса на данни. JSON Schema не я добавя автоматично.",
  schemaExamples:
    "Масив от примерни стойности, които показват употребата на полето.",
  schemaReadOnly:
    "Отбелязва данни, предоставени от приложението, които не трябва да се редактират.",
  schemaWriteOnly: "Отбелязва данни само за въвеждане, например парола.",
  schemaDeprecated:
    "Отбелязва остаряло поле, като запазва съвместимостта със съществуващите данни.",
  schemaConst: "Единствената JSON стойност, разрешена за полето.",
  schemaEnum: "Масив с всички разрешени JSON стойности.",
  schemaRef: "Препратка към друга схема, например #/definitions/Address.",
  schemaComment:
    "Бележка за авторите на схемата, която не се показва като помощ във формуляра.",
  readonly:
    "Забранява редактирането на тази контрола, без да променя схемата на полето.",
  multi: "Показва текстова област за няколко реда.",
  required:
    "Изисква свойството да присъства в родителския обект. Празните стойности се контролират отделно.",
  minLength: "Минимален брой знаци в текста.",
  maxLength: "Максимален брой знаци в текста.",
  pattern:
    "Регулярен израз за текста. Използвайте ^ и $, за да проверите цялата стойност.",
  format:
    "Смислов формат като email, date, date-time или uri. Проверката зависи от валидатора.",
  minimum: "Най-малко разрешено число, включително границата.",
  maximum: "Най-голямо разрешено число, включително границата.",
  exclusiveMinimum: "Стойността трябва да е по-голяма от това число.",
  exclusiveMaximum: "Стойността трябва да е по-малка от това число.",
  multipleOf: "Изисква кратно на това положително число.",
  minItems: "Минимален брой елементи в масива.",
  maxItems: "Максимален брой елементи в масива.",
  uniqueItems: "Изисква всички елементи на масива да са различни.",
  minProperties: "Минимален брой свойства в обекта.",
  maxProperties: "Максимален брой свойства в обекта.",
  columns:
    "Ширина в хоризонтална подредба от 2 до 16 колони. Автоматично разпределя останалото място.",
  collapsible: "Позволява разгъване и свиване на групата.",
  collapsed: "Показва групата свита при отваряне на формуляра.",
  showDataIndicator: "Показва индикатор, когато групата съдържа данни.",
  i18n: "Ключ за превод на етикета и описанието на елемента.",
  translatedLabel: "Етикет или текст за този език.",
  translatedDescription: "Помощен текст за полето на този език.",
  rule: "Показване, скриване, разрешаване или забраняване на елемента при изпълнено условие.",
  choiceMode: "Записва изборите като enum или като oneOf със заглавия.",
  choiceWidget: "Показва изборите като падащ списък или радио бутони.",
  choiceRows: "Разрешени стойности и незадължителни заглавия.",
};
export const inspectorBg: Record<string, string> = {
  "Resize width": "Промяна на ширината",
  "Drag to resize. Use arrow keys to adjust columns; Escape cancels.": "Плъзнете за промяна на ширината. Стрелките променят колоните; Escape отменя.",
  ...Object.fromEntries(
    Object.entries(help).map(([key, value]) => [fieldHelp[key], value]),
  ),
  "Vertical Layout": "Вертикална подредба",
  "Horizontal Layout": "Хоризонтална подредба",
  "Items type": "Тип на елементите",
  "Layout type": "Тип подредба",
  "Text Field": "Текстово поле",
  "Text Area": "Текстова област",
  "Text / Label": "Текст / Етикет",
  Number: "Число",
  Checkbox: "Поле за отметка",
  "Search components": "Търсене на компоненти",
  "Filter properties": "Филтриране на свойства",
  "No matching fields.": "Няма съвпадащи полета.",
  "Drag a component onto the form.": "Плъзнете компонент във формуляра.",
  "Drag a category here to add a tab":
    "Плъзнете категория тук, за да добавите раздел",
  "Drag components or fields into this layout":
    "Плъзнете компоненти или полета в тази подредба",
  Field: "Поле",
  Advanced: "Разширени",
  "Default value": "Стойност по подразбиране",
  Examples: "Примери",
  "Constant value": "Постоянна стойност",
  "Allowed values": "Разрешени стойности",
  "Read only annotation": "Анотация само за четене",
  "Write only": "Само за запис",
  Deprecated: "Остаряло",
  Reference: "Препратка",
  Comment: "Коментар",
  "Exclusive minimum": "Изключващ минимум",
  "Exclusive maximum": "Изключващ максимум",
  "Apply value": "Прилагане на стойността",
  "Enter JSON. Leave empty to remove this property.":
    "Въведете JSON. Оставете празно, за да премахнете свойството.",
  "Enter valid JSON.": "Въведете валиден JSON.",
  "Enter a valid value for this schema property.":
    "Въведете валидна стойност за това свойство на схемата.",
  "Delete this field and its data, connected controls, and rules? This can be undone.":
    "Да се изтрият ли полето, данните му, свързаните контроли и правила? Действието може да се отмени.",
};
const advancedTranslations: [string, string, string, string][] = [
  [
    "Required properties",
    "Задължителни свойства",
    "An array of property names that must be present in this object.",
    "Масив с имената на свойствата, които трябва да присъстват в обекта.",
  ],
  [
    "Properties",
    "Свойства",
    "Schemas for named object properties.",
    "Схеми за именуваните свойства на обекта.",
  ],
  [
    "Pattern properties",
    "Свойства по шаблон",
    "Map regular expressions to schemas for matching property names.",
    "Свързва регулярни изрази със схеми за съвпадащите имена на свойства.",
  ],
  [
    "Additional properties",
    "Допълнителни свойства",
    "Allow extra properties with true, reject them with false, or supply their schema.",
    "Разрешете допълнителни свойства с true, забранете ги с false или задайте схема за тях.",
  ],
  [
    "Property names",
    "Имена на свойства",
    "Schema applied to every property name in the object.",
    "Схема за всяко име на свойство в обекта.",
  ],
  [
    "Dependencies",
    "Зависимости",
    "Property dependencies or schema dependencies, using the document's schema dialect.",
    "Зависимости между свойства или схеми според диалекта на документа.",
  ],
  [
    "Dependent required",
    "Задължителни зависимости",
    "Map a property name to other properties required when it is present.",
    "Свързва свойство с други свойства, задължителни при неговото наличие.",
  ],
  [
    "Dependent schemas",
    "Зависими схеми",
    "Schemas applied when their corresponding property is present.",
    "Схеми, прилагани при наличие на съответното свойство.",
  ],
  [
    "Unevaluated properties",
    "Непроверени свойства",
    "Schema or boolean for properties not evaluated by other keywords.",
    "Схема или булева стойност за свойства, които не са проверени от други ключови думи.",
  ],
  [
    "Items",
    "Елементи",
    "Schema for array entries, or tuple schemas in older dialects.",
    "Схема за елементите на масива или позиционни схеми в по-стари диалекти.",
  ],
  [
    "Prefix items",
    "Начални елементи",
    "An array of schemas for positional entries in a 2020-12 tuple.",
    "Масив от схеми за позиционните елементи на кортеж в 2020-12.",
  ],
  [
    "Additional items",
    "Допълнителни елементи",
    "Schema or boolean for extra tuple entries in older dialects.",
    "Схема или булева стойност за допълнителни елементи на кортеж в по-стари диалекти.",
  ],
  [
    "Contains",
    "Съдържа",
    "Schema that at least one array entry must match.",
    "Схема, на която трябва да отговаря поне един елемент на масива.",
  ],
  [
    "Minimum matches",
    "Минимален брой съвпадения",
    "Minimum number of entries matching contains (2019-09 and later).",
    "Минимален брой елементи, съответстващи на contains (2019-09 и по-нови).",
  ],
  [
    "Maximum matches",
    "Максимален брой съвпадения",
    "Maximum number of entries matching contains (2019-09 and later).",
    "Максимален брой елементи, съответстващи на contains (2019-09 и по-нови).",
  ],
  [
    "Unevaluated items",
    "Непроверени елементи",
    "Schema or boolean for array entries not evaluated by other keywords.",
    "Схема или булева стойност за елементи, които не са проверени от други ключови думи.",
  ],
  [
    "All of",
    "Всички от",
    "An array of schemas that must all validate the value.",
    "Масив от схеми, на които стойността трябва да отговаря едновременно.",
  ],
  [
    "Any of",
    "Поне една от",
    "An array of schemas; at least one must validate the value.",
    "Масив от схеми; стойността трябва да отговаря на поне една.",
  ],
  [
    "One of",
    "Точно една от",
    "An array of schemas; exactly one must validate the value.",
    "Масив от схеми; стойността трябва да отговаря на точно една.",
  ],
  [
    "Not",
    "Отрицание",
    "Schema that the value must not satisfy.",
    "Схема, на която стойността не трябва да отговаря.",
  ],
  [
    "If",
    "Ако",
    "Condition schema selecting the then or else validation branch.",
    "Условна схема, която избира клона then или else.",
  ],
  [
    "Then",
    "Тогава",
    "Schema applied when the if schema matches.",
    "Схема, прилагана при изпълнено условие if.",
  ],
  [
    "Else",
    "Иначе",
    "Schema applied when the if schema does not match.",
    "Схема, прилагана при неизпълнено условие if.",
  ],
  [
    "Definitions",
    "Дефиниции",
    "Named reusable schemas for 2019-09 and later dialects.",
    "Именувани схеми за многократна употреба в 2019-09 и по-нови диалекти.",
  ],
  [
    "Definitions",
    "Дефиниции",
    "Named reusable schemas for draft-07 and earlier dialects.",
    "Именувани схеми за многократна употреба в draft-07 и по-стари диалекти.",
  ],
  [
    "Content encoding",
    "Кодиране на съдържанието",
    "Encoding of string content, such as base64.",
    "Кодиране на текстовото съдържание, например base64.",
  ],
  [
    "Content media type",
    "Медиен тип на съдържанието",
    "Media type of the string content, such as application/json.",
    "Медиен тип на текстовото съдържание, например application/json.",
  ],
  [
    "Content schema",
    "Схема на съдържанието",
    "Schema describing decoded string content.",
    "Схема, описваща декодираното текстово съдържание.",
  ],
];
for (const [
  label,
  translatedLabel,
  description,
  translatedDescription,
] of advancedTranslations) {
  inspectorBg[label] = translatedLabel;
  inspectorBg[description] = translatedDescription;
}
