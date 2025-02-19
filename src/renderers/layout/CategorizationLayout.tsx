/*
  This renderer was adapted from the JSON forms library.
  ----------------------------------------------------------------------------

  The MIT License

  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import {
  and,
  Categorization,
  Category,
  deriveLabelForUISchemaElement,
  isVisible,
  RankedTester,
  rankWith,
  StatePropsOfLayout,
  Tester,
  UISchemaElement,
  uiTypeIs,
} from '@jsonforms/core';
import {
  AjvProps,
  MaterialLayoutRenderer,
  MaterialLayoutRendererProps,
  withAjvProps,
} from '@jsonforms/material-renderers';
import { TranslateProps, withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { useMemo, useState } from 'react';
import {
  getCurrentTab,
  setCurrentTab,
} from '../../controller/local/EditController/StandardMode/access';
import {
  getCategoryErrs,
  registerOnUpdateCategoryErrors,
} from '../../controller/local/EditController/StandardMode/tabs';
import ControlBar from '../../view/components/Tabs/ControlBar';
import Tab from '../../view/components/Tabs/Tab';

export const isSingleLevelCategorization: Tester = and(
  uiTypeIs('Categorization'),
  (uischema: UISchemaElement): boolean => {
    const categorization = uischema as Categorization;

    return (
      categorization.elements &&
      categorization.elements.reduce((acc, e) => acc && e.type === 'Category', true)
    );
  },
);

export const CategorizationTester: RankedTester = rankWith(21, isSingleLevelCategorization);
export interface CategorizationState {
  activeCategory: number;
}

export interface CategorizationLayoutRendererProps
  extends StatePropsOfLayout,
    AjvProps,
    TranslateProps {
  selected?: number;
  ownState?: boolean;
  data?: any;
  onChange?(selected: number, prevSelected: number): void;
}

export const CategorizationLayoutRenderer = (props: CategorizationLayoutRendererProps) => {
  const {
    data,
    path,
    renderers,
    cells,
    schema,
    uischema,
    visible,
    enabled,
    selected,
    onChange,
    ajv,
    t,
  } = props;

  // if ((props.uischema as any).elements) {
  //   for (const cat of (props.uischema as any).elements) {
  //     if (cat.elements.length > 20) {
  //       tsAddWarningMessage(
  //         2,
  //         'Potentially big category',
  //         'It looks like there are more than 20 elements in this category. You may want to consider adding new ones. ' +
  //           '(Adding them conditionally.)',
  //         cat.label ?? 'Category',
  //         getCurrentContext()?.rc.backendObject?.title ?? 'Unknown',
  //       );
  //     }
  //   }
  // }
  const categorization = uischema as Categorization;
  const [previousCategorization, setPreviousCategorization] = useState<Categorization>(
    uischema as Categorization,
  );
  const [activeCategory, setActiveCategory] = useState<number>(selected ?? getCurrentTab());
  const categories = useMemo(
    () =>
      categorization.elements.filter((category: Category | Categorization) =>
        //@ts-expect-error ................
        isVisible(category, data, undefined, ajv),
      ),
    [categorization, data, ajv],
  );
  const [catErrs, setCatErrs] = useState<boolean[]>(
    getCategoryErrs() ?? categories.map(() => false),
  );
  registerOnUpdateCategoryErrors((v: boolean[]) => {
    setCatErrs([...v]);
  });

  if (categorization !== previousCategorization) {
    setActiveCategory(getCurrentTab());
    setCurrentTab(getCurrentTab());
    setPreviousCategorization(categorization);
  }

  const safeCategory =
    activeCategory >= categorization.elements.length ? getCurrentTab() : activeCategory;

  const childProps: MaterialLayoutRendererProps = {
    elements: categories[safeCategory] ? categories[safeCategory].elements : [],
    schema,
    path,
    direction: 'column',
    enabled,
    visible,
    renderers,
    cells,
  };
  const onTabChange = (_event: any, value: number) => {
    setCurrentTab(value);
    if (onChange) {
      onChange(value, safeCategory);
    }
    setActiveCategory(value);
  };

  const tabLabels = useMemo(() => {
    return categories.map((e: Category | Categorization) => deriveLabelForUISchemaElement(e, t));
  }, [categories, t]);

  if (!visible) {
    return <></>;
  }
  return (
    <>
      <div className="h-full flex flex-col">
        <div className="static w-full" style={{ top: 0 }}>
          <ControlBar>
            {(() => {
              return categories.map((_, idx: number) => (
                <Tab
                  index={idx}
                  label={tabLabels[idx]}
                  currentTab={safeCategory}
                  onClick={onTabChange}
                  hasError={catErrs[idx]}
                />
              ));
            })()}
          </ControlBar>
        </div>
        {/* <div className='bg-white w-full h-5 static mb-6 flex gap-4 border-b border-stroke sm:gap-10'></div> */}
        {/* 0.5em */}
        <div
          className="flex flex-col rounded grow overflow-auto pb-12"
          style={{ marginTop: '0.5em', height: '100%' }}
        >
          {/* TODO: Check option of going multicolumn? */}
          {/* <div className='' style={{ height:"100%", flexGrow: 0, flexShrink: 0, flexBasis: 100, flexDirection:"row", flex:0 }}> */}
          <MaterialLayoutRenderer {...childProps} key={safeCategory} />
          {/* </div> */}
        </div>
      </div>
    </>
  );
};

export default withAjvProps(
  withTranslateProps(withJsonFormsLayoutProps(CategorizationLayoutRenderer)),
);
