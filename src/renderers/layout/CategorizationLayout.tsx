/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * For this renderer, parts of the categorization renderer from json forms was used for guidance;
 * due to the lack of any documentation.
 */
import {
  Categorization,
  Category,
  isVisible,
  RankedTester,
  StatePropsOfLayout,
  withIncreasedRank,
} from '@jsonforms/core';
import {
  AjvProps,
  materialCategorizationTester,
  MaterialLayoutRenderer,
  withAjvProps,
} from '@jsonforms/material-renderers';
import { TranslateProps, withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { useEffect, useMemo, useState } from 'react';
import { tsAddWarningMessage } from '../../controller/global/troubleshoot';
import { getCurrentContext } from '../../controller/local/EditController/ExpertMode/access';
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
import { sanitizeCategory } from '../utils/dataSanitization';

export const CategorizationTester: RankedTester = withIncreasedRank(
  21,
  materialCategorizationTester,
);

// Adapted from Json Forms, as they did not make this available from the library...(COME ON WHY)
export interface CategorizationLayoutRendererProps
  extends StatePropsOfLayout,
    AjvProps,
    TranslateProps {
  selected?: number;
  ownState?: boolean;
  data?: any;
  onChange?(selected: number, prevSelected: number): void;
}

/**
 * Checks which are for the admin (production: false, in the schema warnings.)
 * @param uischema
 */
function checkSchema(uischema: Categorization) {
  if (uischema.elements) {
    for (const cat of uischema.elements) {
      if (cat.elements.length > 20) {
        tsAddWarningMessage(
          2,
          'Potentially big category',
          'It looks like there are more than 20 elements in this category. You may want to consider adding new ones. ' +
            '(Adding them conditionally.)',
          cat.label ?? 'Category',
          getCurrentContext()?.rc.backendObject?.title ?? 'Unknown',
        );
      }
    }
  }
}

/**
 * The renderer for the tabs and making sure that only the active parameters are actually being
 * rendered, which is crucial for performance.
 * @param props
 * @returns
 */
export const CategorizationLayoutRenderer = (props: CategorizationLayoutRendererProps) => {
  const {
    path,
    schema,
    uischema,
    visible,
    enabled,
    selected,
    onChange,
    renderers,
    cells,
    data,
    ajv,
  } = props;
  if (!visible) {
    return <></>;
  }
  const categorization = uischema as Categorization;
  checkSchema(categorization);
  const [activeCategory, setActiveCategory] = useState<number>(selected ?? getCurrentTab());
  const categories = useMemo(
    () =>
      categorization.elements.filter((category: Category | Categorization) =>
        //@ts-expect-error no path required here
        isVisible(category, data, undefined, ajv),
      ),
    [categorization, data, ajv],
  );
  const [catErrs, setCatErrs] = useState<boolean[]>(
    getCategoryErrs() ?? categories.map(() => false),
  );

  // Register callback
  registerOnUpdateCategoryErrors((v: boolean[]) => {
    setCatErrs([...v]);
  });

  useEffect(() => {
    setCurrentTab(getCurrentTab());
    setActiveCategory(getCurrentTab());
  }, [categorization]);

  const safeCategory = sanitizeCategory(activeCategory, categorization);

  const onTabChange = (_event: any, value: number) => {
    setCurrentTab(value);
    if (onChange) {
      onChange(value, safeCategory);
    }
    setActiveCategory(value);
  };

  // Memoize since this changes hardly anytime (except if category is added or removed)
  const tabLabels = useMemo(() => {
    return categories.map((e: Category | Categorization) => e.label);
  }, [categories]);

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
        <div className="flex flex-col rounded grow overflow-auto pb-12 h-full mt-4">
          {/* TODO: Check option of going multicolumn? */}
          {/* <div className='' style={{ height:"100%", flexGrow: 0, flexShrink: 0, flexBasis: 100, flexDirection:"row", flex:0 }}> */}
          <MaterialLayoutRenderer
            elements={categories[safeCategory] ? categories[safeCategory].elements : []}
            schema={schema}
            path={path}
            direction="column"
            enabled={enabled}
            visible={visible}
            renderers={renderers}
            cells={cells}
            key={safeCategory}
          />
        </div>
      </div>
    </>
  );
};

export default withAjvProps(
  withTranslateProps(withJsonFormsLayoutProps(CategorizationLayoutRenderer)),
);
