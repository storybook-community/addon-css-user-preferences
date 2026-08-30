import type { WithHideFn } from "./types";
import type { Globals } from "./useGlobals";

import React, { useCallback } from "react";
import { useGlobals as useStorybookGlobals } from "storybook/manager-api";
import { useGlobals } from "./useGlobals";
import { IconButton, WithTooltip } from "storybook/internal/components";
import { TOOL_ID } from "./constants";
import * as options from "./options";
import { TooltipList } from "./components/TooltipList";
import { Icon } from "./components/Icon";
import { Select } from "./components/Select";

export const Tool = () => {
  const [globals, updateGlobals, pinned] = useGlobals(useStorybookGlobals);

  const toggle = useCallback(
    (id: keyof Globals, value: Globals[typeof id]) =>
      updateGlobals({
        [id]: value ? value : undefined,
      }),
    Object.values(globals)
  );

  const createItems = ({ onHide }: WithHideFn) =>
    options.keys.map((id) => {
      // A story that pins a feature in its own `globals` always wins, so the
      // toolbar offers it read-only rather than accepting a discarded change.
      const pinnedTo = pinned[id];

      return {
        id,
        title: id,
        right: (
          <Select
            defaultValue={globals[id]}
            disabled={pinnedTo !== undefined}
            title={
              pinnedTo === undefined
                ? undefined
                : `This story sets ${id} to ${pinnedTo}.`
            }
            onChange={(event) => {
              onHide();
              // the empty option clears the preference; the rest are feature values
              toggle(id, event.currentTarget.value as Globals[typeof id]);
            }}
          >
            <option value="">{options.defaultOption}</option>
            {Object.values(options.features[id]).map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
        ),
      };
    });

  return (
    <WithTooltip
      placement="top"
      trigger="click"
      tooltip={(props) => <TooltipList items={createItems(props)} />}
    >
      <IconButton key={TOOL_ID} title={options.title}>
        <Icon />
      </IconButton>
    </WithTooltip>
  );
};
