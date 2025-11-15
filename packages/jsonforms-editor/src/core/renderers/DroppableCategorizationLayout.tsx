/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */

import {
  Category,
  isCategorization,
  rankWith,
  StatePropsOfLayout,
} from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react';
import {
  AppBar,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Tabs,
  styled,
} from '@mui/material';
import { PlusOne, Tab as TabIcon } from '@mui/icons-material';
import findIndex from 'lodash/findIndex';
import React, { useMemo, useState } from 'react';

import { useCategorizationService, useSelection } from '../../core/context';
import { CategorizationLayout } from '../model/uischema';
import { createCategory } from '../util/generators/uiSchema';
import { DroppableElementRegistration } from './DroppableElement';

interface DroppableCategorizationLayoutProps extends StatePropsOfLayout {
  uischema: CategorizationLayout;
}

const TabContainer = styled(AppBar)({
  position: 'static',
});

const AddTabIconWrapper = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

const DroppableCategorizationLayout: React.FC<
  DroppableCategorizationLayoutProps
> = (props) => {
  const { uischema, schema, path, renderers, cells } = props;

  // ignoring the first selection from the tuple since it is not used
  const [, setSelection] = useSelection();
  const categorizationService = useCategorizationService();

  const categories = uischema.elements;

  const defaultIndex = findIndex(
    categories,
    (cat) => cat.uuid === categorizationService.getTabSelection(uischema)?.uuid
  );

  const [currentIndex, setCurrentIndex] = useState<number | undefined>(
    defaultIndex === -1 ? undefined : defaultIndex
  );

  const indicatorColor: 'secondary' | 'primary' | undefined =
    categories.length === 0 ? 'primary' : 'secondary';

  const setIndex = (value: number, event?: any) => {
    event?.stopPropagation();
    if (value < categories.length) {
      const selectedUuid = categories[value].uuid;

      categorizationService.setTabSelection(uischema, {
        uuid: selectedUuid,
      });
      setSelection({ uuid: selectedUuid });
      setCurrentIndex(value);
    }
  };

  // DroppableControl removed itself before dispatching to us, we need
  // to re-add it for our children
  const renderersToUse = useMemo(() => {
    return renderers && [...renderers, DroppableElementRegistration];
  }, [renderers]);

  const handleChange = (event: any, value: any) => {
    if (typeof value === 'number') {
      setIndex(value, event);
    }
  };

  const addTab = (event: any) => {
    const tab = createCategory('New Tab ' + (categories.length + 1));
    tab.parent = uischema;

    categories.push(tab);
    setIndex(categories.length - 1, event);
  };

  if (currentIndex !== undefined) {
    // in case we have tab that was deleted then we will use the memorized index to determine the previous tab that we are going to select automatically

    if (categories.length === 0) {
      // reset the index since we do not have anything to select
      setCurrentIndex(undefined);
    } else if (currentIndex > categories.length - 1) {
      // check if currentIndex is out of bound because of delete
      setIndex(categories.length - 1);
    } else if (currentIndex !== defaultIndex) {
      // check if current index is out of sync with the service
      setIndex(currentIndex);
    }
  }

  return (
    <Card>
      <CardHeader
        component={() => (
          <TabContainer>
            <Tabs
              indicatorColor={indicatorColor}
              value={currentIndex === undefined ? false : currentIndex}
              onChange={handleChange}
              variant='scrollable'
            >
              {categories.map((e: Category, idx: number) => (
                <Tab key={idx} label={e.label} />
              ))}
              <Tab
                key={categories.length}
                icon={
                  <AddTabIconWrapper>
                    <TabIcon fontSize='small' />
                    <PlusOne />
                  </AddTabIconWrapper>
                }
                onClick={addTab}
              />
            </Tabs>
          </TabContainer>
        )}
      />
      <CardContent>
        {categories.length > 0 && currentIndex !== undefined ? (
          <JsonFormsDispatch
            schema={schema}
            uischema={categories[currentIndex]}
            path={path}
            renderers={renderersToUse}
            cells={cells}
          />
        ) : (
          categories.length === 0 && (
            <span>
              {'No Category. Use '}
              <TabIcon fontSize='small' />
              <PlusOne />
              {' to add a new tab.'}
            </span>
          )
        )}
      </CardContent>
    </Card>
  );
};

export const DroppableCategorizationLayoutRegistration = {
  tester: rankWith(40, isCategorization), // less than DroppableElement
  renderer: withJsonFormsLayoutProps(
    DroppableCategorizationLayout as React.FC<StatePropsOfLayout>
  ),
};
