/**
 * ---------------------------------------------------------------------
 * Copyright (c) 2021 EclipseSource Munich
 * Licensed under MIT
 * https://github.com/eclipsesource/jsonforms-editor/blob/master/LICENSE
 * ---------------------------------------------------------------------
 */
import { Tab, Tabs } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';

import { TabContent } from '../../core/components';
import { usePaletteService, useSchema } from '../../core/context';
import { SchemaElement } from '../../core/model';
import { JsonSchemaPanel } from './JsonSchemaPanel';
import { SchemaTreeView } from './SchemaTree';
import { UIElementsTree } from './UIElementsTree';
import { UISchemaPanel } from './UISchemaPanel';

const PalettePanelRoot = styled('div')({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
});

const StyledUIElementsTree = styled(UIElementsTree)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

export interface PaletteTab {
  name: string;
  Component: React.ReactElement;
}

export interface PalettePanelProps {
  paletteTabs?: PaletteTab[];
}

export const defaultPalettePanelTabs: PaletteTab[] = [
  {
    name: 'JSON Schema',
    Component: <JsonSchemaPanel />,
  },
  {
    name: 'UI Schema',
    Component: <UISchemaPanel />,
  },
];

export const PalettePanel: React.FC<PalettePanelProps> = ({ paletteTabs }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const schema: SchemaElement | undefined = useSchema();
  const paletteService = usePaletteService();

  return (
    <PalettePanelRoot>
      <Tabs value={selectedTab} onChange={handleTabChange} variant='scrollable'>
        <Tab label='Palette' data-cy='palette-tab' />
        {paletteTabs?.map((tab) => (
          <Tab
            key={`tab-${tab.name}`}
            label={tab.name}
            data-cy={`tab-${tab.name}`}
          />
        ))}
      </Tabs>

      <TabContent index={0} currentIndex={selectedTab}>
        <StyledUIElementsTree elements={paletteService.getPaletteElements()} />
        <SchemaTreeView schema={schema} />
      </TabContent>

      {paletteTabs?.map((tab, index) => (
        <TabContent
          key={`tab-content-${index + 1}`}
          index={index + 1}
          currentIndex={selectedTab}
        >
          {tab.Component}
        </TabContent>
      ))}
    </PalettePanelRoot>
  );
};
